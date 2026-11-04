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
 * fields printed inside it, which the default message does for every field listed here.
 */

import React, { useRef, useState } from 'react';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import { useFormikContext } from 'formik';
import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiSmallButtonEmpty,
} from '@elastic/eui';
import {
  FINDING_FIELDS,
  FIRST_SAMPLE_DOCUMENT_PATH,
  SAMPLE_DOCUMENTS_BLOCK_END,
  SAMPLE_DOCUMENTS_BLOCK_START,
  getDiscoverUrl,
  getFindingLink,
} from '../../AddActionButton/findings-message';

const translate = (id, defaultMessage) =>
  i18n.translate(`alerting.triggers.action.message.variables.${id}`, { defaultMessage });

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

// Without a selection the snippet goes on a new line at the end.
export const insertText = (text, snippet, selection) => {
  if (!selection) {
    const separator = text && !text.endsWith('\n') ? '\n' : '';
    const value = `${text}${separator}${snippet}`;
    return { value, cursor: value.length };
  }
  const { start, end } = selection;
  return {
    value: `${text.slice(0, start)}${snippet}${text.slice(end)}`,
    cursor: start + snippet.length,
  };
};

export const InsertVariable = ({ name, textAreaRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selection = useRef(null);
  const { values, setFieldValue } = useFormikContext();

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
    const text = _.get(values, name) || '';
    const insideSampleDocuments = isInsideSampleDocuments(
      text,
      selection.current ? selection.current.start : text.length
    );
    const snippet = getVariableSnippet(variable, {
      insideSampleDocuments,
      discoverUrl: getDiscoverUrl(),
    });
    const { value, cursor } = insertText(text, snippet, selection.current);
    setFieldValue(name, value);

    const textArea = textAreaRef?.current;
    if (textArea) {
      textArea.focus();
      // After the new value is rendered.
      setTimeout(() => textArea.setSelectionRange(cursor, cursor));
    }
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
      panelPaddingSize="none"
      anchorPosition="downRight"
    >
      <EuiContextMenuPanel
        size="s"
        items={getMessageVariables().map((variable) => (
          <EuiContextMenuItem
            key={variable.id}
            data-test-subj={`insertMessageVariable-${variable.id}`}
            onClick={() => onSelect(variable)}
          >
            {variable.label}
          </EuiContextMenuItem>
        ))}
      />
    </EuiPopover>
  );
};
