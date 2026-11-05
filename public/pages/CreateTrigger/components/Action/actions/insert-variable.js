/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Wazuh: lets the user insert the fields of a finding in the message without knowing their
 * Mustache paths.
 *
 * A finding field is inserted as `{{_source.<field>}}` when the cursor is inside a
 * `{{#sample_documents}}...{{/sample_documents}}` block, so it prints every finding and the indexer
 * fetches it. Elsewhere it is inserted with the full path of the first finding,
 * `{{ctx.alerts.0.sample_documents.0._source.<field>}}`, which also makes the indexer fetch the
 * documents. When the message has a sample documents block too, the indexer only fetches the
 * fields printed inside it, which the default message does for every field listed here. That is
 * why the other fields of the monitor indices are only offered inside a sample documents block.
 */

import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import { useFormikContext } from 'formik';
import {
  EuiPopover,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSelectable,
  EuiSmallButtonEmpty,
  EuiText,
} from '@elastic/eui';
import { getClient } from '../../../../../services';
import { getDataSourceQueryObj } from '../../../../utils/helpers';
import { getPathsPerDataTypeWithDynamicTemplates } from '../../../../CreateMonitor/containers/DefineMonitor/utils/mappings';
import {
  FINDING_FIELDS,
  FIRST_SAMPLE_DOCUMENT_PATH,
  SAMPLE_DOCUMENTS_BLOCK_END,
  SAMPLE_DOCUMENTS_BLOCK_START,
  getDiscoverUrl,
  getFindingLink,
} from '../../AddActionButton/findings-message';

const translate = (id, defaultMessage, values) =>
  i18n.translate(`alerting.triggers.action.message.variables.${id}`, { defaultMessage, values });

/*
 * A variable prints a finding field (`field`), the link to the finding (`link`) or a value of the
 * execution (`tag`). The title is printed unescaped (`raw`), as it is free text.
 */
export const getMessageVariables = () => [
  {
    id: 'findingTitle',
    label: translate('findingTitle', 'Finding title'),
    field: FINDING_FIELDS.TITLE,
    raw: true,
  },
  { id: 'severity', label: translate('severity', 'Severity'), field: FINDING_FIELDS.SEVERITY },
  {
    id: 'endpointName',
    label: translate('endpointName', 'Endpoint name'),
    field: FINDING_FIELDS.ENDPOINT_NAME,
  },
  {
    id: 'endpointId',
    label: translate('endpointId', 'Endpoint ID'),
    field: FINDING_FIELDS.ENDPOINT_ID,
  },
  { id: 'user', label: translate('user', 'User'), field: FINDING_FIELDS.USER },
  { id: 'sourceIp', label: translate('sourceIp', 'Source IP'), field: FINDING_FIELDS.SOURCE_IP },
  { id: 'findingLink', label: translate('findingLink', 'Link to finding'), link: true },
  { id: 'monitorName', label: translate('monitorName', 'Monitor name'), tag: 'ctx.monitor.name' },
  { id: 'triggerName', label: translate('triggerName', 'Trigger name'), tag: 'ctx.trigger.name' },
];

export const isInsideSampleDocuments = (text, position) => {
  const before = text.slice(0, position);
  const blockStart = before.lastIndexOf(SAMPLE_DOCUMENTS_BLOCK_START);
  return blockStart !== -1 && before.indexOf(SAMPLE_DOCUMENTS_BLOCK_END, blockStart) === -1;
};

export const getVariableSnippet = (variable, { insideSampleDocuments = false, discoverUrl }) => {
  const documentPath = insideSampleDocuments ? '' : FIRST_SAMPLE_DOCUMENT_PATH;
  if (variable.link) {
    return getFindingLink(discoverUrl, documentPath);
  }
  if (variable.field) {
    const tag = `${documentPath ? `${documentPath}.` : ''}_source.${variable.field}`;
    return variable.raw ? `{{{${tag}}}}` : `{{${tag}}}`;
  }
  return `{{${variable.tag}}}`;
};

/*
 * Without a selection the snippet goes on a new line at the end. A cursor at the end of a line also
 * starts a new line, so the snippet is not glued to the tag before it.
 */
export const insertText = (text, snippet, selection) => {
  if (!selection) {
    const separator = text && !text.endsWith('\n') ? '\n' : '';
    const value = `${text}${separator}${snippet}`;
    return { value, cursor: value.length };
  }
  const { start, end } = selection;
  const atLineEnd =
    start === end &&
    start > 0 &&
    text[start - 1] !== '\n' &&
    (start === text.length || text[start] === '\n');
  const inserted = atLineEnd ? `\n${snippet}` : snippet;
  return {
    value: `${text.slice(0, start)}${inserted}${text.slice(end)}`,
    cursor: start + inserted.length,
  };
};

/*
 * Fields of the source documents of the monitor indices, from their mappings. Dropped: the
 * `.keyword` subfields and the object fields (the documents only have their leaf fields), the
 * dynamic template patterns, and the finding fields the menu already offers.
 */
export const getIndexFields = (mappings) => {
  const fields = new Set(
    Object.entries(getPathsPerDataTypeWithDynamicTemplates(mappings)).flatMap(([type, paths]) =>
      // A location is printed as a map, so its coordinates are offered instead.
      type === 'geo_point'
        ? [...paths].flatMap((path) => [`${path}.lat`, `${path}.lon`])
        : [...paths]
    )
  );
  const findingFields = new Set(Object.values(FINDING_FIELDS));
  const sourceFields = [...fields]
    .filter(
      (field) => !(field.endsWith('.keyword') && fields.has(field.slice(0, -'.keyword'.length)))
    )
    .sort();
  return sourceFields.filter(
    (field, index) =>
      !field.includes('*') &&
      !findingFields.has(field) &&
      // Sorted, so the children of an object field come right after it.
      !(sourceFields[index + 1] || '').startsWith(`${field}.`)
  );
};

/*
 * The mappings are requested the first time the menu opens for some indices. A failed request is
 * sent again the next time the menu opens.
 */
const useIndexFields = (indices, isOpen) => {
  const [state, setState] = useState({ fields: [], isLoading: false, hasError: false });
  const requestedIndices = useRef(null);
  const indicesKey = (indices || []).join(',');

  useEffect(() => {
    if (!isOpen || !indicesKey || requestedIndices.current === indicesKey) return;
    requestedIndices.current = indicesKey;
    setState({ fields: [], isLoading: true, hasError: false });
    const onError = () => {
      requestedIndices.current = null;
      setState({ fields: [], isLoading: false, hasError: true });
    };
    getClient()
      .post('/api/alerting/_mappings', {
        body: JSON.stringify({ index: indicesKey.split(',') }),
        query: getDataSourceQueryObj()?.query,
      })
      .then((response) =>
        response.ok
          ? setState({ fields: getIndexFields(response.resp), isLoading: false, hasError: false })
          : onError()
      )
      .catch(onError);
  }, [isOpen, indicesKey]);

  return state;
};

export const InsertVariable = ({ name, textAreaRef, indices }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selection = useRef(null);
  const insertedCursor = useRef(null);
  const { values, setFieldValue } = useFormikContext();
  const text = _.get(values, name) || '';
  const insideSampleDocuments = isInsideSampleDocuments(
    text,
    selection.current ? selection.current.start : text.length
  );
  // The index fields can only be inserted inside a sample documents block, so they load there.
  const { fields, isLoading, hasError } = useIndexFields(indices, isOpen && insideSampleDocuments);

  const commonVariables = getMessageVariables();
  const fieldVariables = fields.map((field) => ({ id: `field:${field}`, label: field, field }));
  const variablesById = _.keyBy([...commonVariables, ...fieldVariables], 'id');
  const toOption = (variable) => ({
    key: variable.id,
    label: variable.label,
    'data-test-subj': `insertMessageVariable-${variable.id}`,
  });
  // The notes are short enough to fit the list row, which cuts longer text.
  const getIndexFieldOptions = () => {
    if (!insideSampleDocuments) {
      return [
        {
          key: 'indexFieldsOutsideBlock',
          label: translate('indexFieldsOutsideBlock', 'Only inside {blockTag}', {
            blockTag: SAMPLE_DOCUMENTS_BLOCK_START,
          }),
          disabled: true,
        },
      ];
    }
    if (hasError) {
      return [
        {
          key: 'indexFieldsError',
          label: translate('indexFieldsError', 'Could not load them, reopen to retry'),
          disabled: true,
        },
      ];
    }
    return fieldVariables.map(toOption);
  };
  const indexFieldOptions = getIndexFieldOptions();
  const options = [
    { label: translate('commonGroup', 'Common'), isGroupLabel: true },
    ...commonVariables.map(toOption),
    ...(indexFieldOptions.length && !_.isEmpty(indices)
      ? [
          { label: translate('indexFieldsGroup', 'Index fields'), isGroupLabel: true },
          ...indexFieldOptions,
        ]
      : []),
  ];

  // The text area loses the focus when the button is pressed, so its selection is read before.
  const rememberSelection = (focusedElement) => {
    const textArea = textAreaRef?.current;
    selection.current =
      textArea && focusedElement === textArea
        ? { start: textArea.selectionStart, end: textArea.selectionEnd }
        : null;
  };

  const onSelect = (variable) => {
    setIsOpen(false);
    const snippet = getVariableSnippet(variable, {
      insideSampleDocuments,
      discoverUrl: getDiscoverUrl(),
    });
    const { value, cursor } = insertText(text, snippet, selection.current);
    setFieldValue(name, value);
    insertedCursor.current = cursor;
  };

  // The popover gives the focus back to its button when it closes, so the text area takes it after.
  const focusTextArea = () => {
    const textArea = textAreaRef?.current;
    const cursor = insertedCursor.current;
    insertedCursor.current = null;
    if (!textArea || cursor === null) return;
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(cursor, cursor);
    });
  };

  const button = (
    <EuiSmallButtonEmpty
      size="xs"
      iconType="arrowDown"
      iconSide="right"
      data-test-subj="insertMessageVariableButton"
      onMouseDown={() => rememberSelection(document.activeElement)}
      onFocus={(event) => rememberSelection(event.relatedTarget)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {i18n.translate('alerting.triggers.action.message.insertVariable', {
        defaultMessage: 'Insert variable',
      })}
    </EuiSmallButtonEmpty>
  );

  return (
    <EuiPopover
      id={`${name}-insert-variable`}
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      onTrapDeactivation={focusTextArea}
      panelPaddingSize="none"
      anchorPosition="downRight"
    >
      <EuiSelectable
        searchable
        singleSelection
        height={300}
        isLoading={isLoading}
        options={options}
        searchProps={{
          compressed: true,
          placeholder: translate('searchPlaceholder', 'Search variables and fields'),
          'data-test-subj': 'insertMessageVariableSearch',
        }}
        onChange={(newOptions) => {
          const picked = newOptions.find((option) => option.checked === 'on');
          if (picked && variablesById[picked.key]) onSelect(variablesById[picked.key]);
        }}
      >
        {(list, search) => (
          <div style={{ width: 320 }}>
            <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
            {list}
          </div>
        )}
      </EuiSelectable>
      <EuiPopoverFooter paddingSize="s">
        <EuiText size="xs" color="subdued" style={{ maxWidth: 300 }}>
          {/* The alerting app has no intl provider, so the text is not a FormattedMessage. */}
          {i18n.translate('alerting.triggers.action.message.otherFindingFields', {
            defaultMessage: 'For another field of the finding, write {fieldTag} inside {blockTag}.',
            values: {
              fieldTag: '{{_source.<field>}}',
              blockTag: SAMPLE_DOCUMENTS_BLOCK_START,
            },
          })}
        </EuiText>
      </EuiPopoverFooter>
    </EuiPopover>
  );
};
