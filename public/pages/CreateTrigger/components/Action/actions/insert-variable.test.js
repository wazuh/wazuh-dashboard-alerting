/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Formik } from 'formik';
import {
  InsertVariable,
  getIndexFields,
  getMessageVariables,
  getVariableSnippet,
  insertText,
} from './insert-variable';
import { setClient } from '../../../../../services';

const mockPost = jest.fn();

const getVariable = (id) => getMessageVariables().find((variable) => variable.id === id);

describe('getVariableSnippet', () => {
  const discoverUrl = 'https://dashboard.example/app/discover';

  test('prints the field of every finding inside a sample documents block', () => {
    expect(
      getVariableSnippet(getVariable('endpointName'), { insideSampleDocuments: true, discoverUrl })
    ).toBe('{{_source.wazuh.agent.name}}');
  });

  test('prints the field of the first finding elsewhere', () => {
    expect(getVariableSnippet(getVariable('endpointName'), { discoverUrl })).toBe(
      '{{ctx.alerts.0.sample_documents.0._source.wazuh.agent.name}}'
    );
    expect(getVariableSnippet(getVariable('findingLink'), { discoverUrl })).toBe(
      'https://dashboard.example/app/discover#/doc/wazuh-findings-v5%2A/' +
        '{{ctx.alerts.0.sample_documents.0._index}}?id={{ctx.alerts.0.sample_documents.0._id}}'
    );
  });
});

describe('insertText', () => {
  test.each([
    ['on a new line at the end', 'Hello', null, 'Hello\n{{x}}'],
    ['at the end after a line break', 'Hello\n', null, 'Hello\n{{x}}'],
    ['at the cursor', 'Hello world', { start: 6, end: 6 }, 'Hello {{x}}world'],
    [
      'on a new line at the end of a line',
      'Hello\nworld',
      { start: 5, end: 5 },
      'Hello\n{{x}}\nworld',
    ],
  ])('inserts the text %s', (_description, text, selection, expected) => {
    const { value, cursor } = insertText(text, '{{x}}', selection);
    expect(value).toBe(expected);
    expect(value.slice(0, cursor).endsWith('{{x}}')).toBe(true);
  });
});

describe('getIndexFields', () => {
  test('lists the leaf fields of the source documents the menu does not offer yet', () => {
    const mappings = {
      'wazuh-findings-v5-security': {
        mappings: {
          properties: {
            wazuh: { properties: { rule: { properties: { title: { type: 'keyword' } } } } },
            message: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            host: { properties: { geo: { type: 'object' } } },
            source: { properties: { geo: { properties: { location: { type: 'geo_point' } } } } },
          },
        },
      },
      'wazuh-findings-v5-system-activity': {
        mappings: {
          properties: {
            host: { properties: { geo: { properties: { city: { type: 'keyword' } } } } },
          },
        },
      },
    };

    expect(getIndexFields(mappings)).toEqual([
      'host.geo.city',
      'message',
      'source.geo.location.lat',
      'source.geo.location.lon',
    ]);
  });
});

describe('InsertVariable', () => {
  const mountInsertVariable = (initialValues, indices) => {
    const formik = {};
    const wrapper = mount(
      <Formik initialValues={initialValues} onSubmit={jest.fn()}>
        {(props) => {
          formik.values = props.values;
          return (
            <InsertVariable name="message" textAreaRef={{ current: null }} indices={indices} />
          );
        }}
      </Formik>
    );
    return { wrapper, formik };
  };

  const open = async (wrapper) => {
    await act(async () => {
      wrapper.find('button[data-test-subj="insertMessageVariableButton"]').simulate('click');
    });
    wrapper.update();
  };

  const pick = async (wrapper, id) => {
    // The list is virtualized and renders no rows without a layout, so the choice is sent directly.
    const selectable = wrapper.find('EuiSelectable');
    const options = selectable
      .prop('options')
      .map((option) => (option.key === id ? { ...option, checked: 'on' } : option));
    await act(async () => {
      selectable.prop('onChange')(options);
    });
  };

  beforeEach(() => {
    mockPost.mockReset();
    setClient({ post: mockPost });
  });

  test('inserts the selected variable in the message', async () => {
    const { wrapper, formik } = mountInsertVariable({ message: 'Hello' });

    await open(wrapper);
    await pick(wrapper, 'monitorName');

    expect(formik.values.message).toBe('Hello\n{{ctx.monitor.name}}');
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('inserts any field of the monitor indices', async () => {
    mockPost.mockResolvedValue({
      ok: true,
      resp: {
        'wazuh-findings-v5-security': {
          mappings: { properties: { process: { properties: { name: { type: 'keyword' } } } } },
        },
      },
    });
    const { wrapper, formik } = mountInsertVariable({ message: '{{#sample_documents}}' }, [
      'wazuh-findings-v5-security',
    ]);

    await open(wrapper);
    wrapper.update();
    await pick(wrapper, 'field:process.name');

    expect(mockPost).toHaveBeenCalledWith('/api/alerting/_mappings', {
      body: JSON.stringify({ index: ['wazuh-findings-v5-security'] }),
      query: undefined,
    });
    expect(formik.values.message).toBe('{{#sample_documents}}\n{{_source.process.name}}');
  });

  test('tells when the index fields could not be loaded and retries when reopened', async () => {
    mockPost.mockRejectedValueOnce(new Error('Internal Server Error')).mockResolvedValueOnce({
      ok: true,
      resp: {
        'wazuh-findings-v5-security': {
          mappings: { properties: { process: { properties: { name: { type: 'keyword' } } } } },
        },
      },
    });
    const { wrapper } = mountInsertVariable({ message: '{{#sample_documents}}' }, [
      'wazuh-findings-v5-security',
    ]);
    const getKeys = () =>
      wrapper
        .find('EuiSelectable')
        .prop('options')
        .map((option) => option.key);

    await open(wrapper);
    wrapper.update();
    expect(getKeys()).toContain('indexFieldsError');

    await open(wrapper); // Closes the menu.
    await open(wrapper);
    wrapper.update();
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(getKeys()).toContain('field:process.name');
  });

  test('offers and loads the index fields inside a sample documents block only', async () => {
    const { wrapper } = mountInsertVariable({ message: 'Hello' }, ['wazuh-findings-v5-security']);

    await open(wrapper);
    wrapper.update();
    const keys = wrapper
      .find('EuiSelectable')
      .prop('options')
      .map((option) => option.key);

    expect(keys).toContain('indexFieldsOutsideBlock');
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('explains how to print another field of the finding', async () => {
    const { wrapper } = mountInsertVariable({ message: '' });

    await open(wrapper);

    expect(wrapper.find('EuiPopoverFooter').text()).toBe(
      'For another field of the finding, write {{_source.<field>}} inside {{#sample_documents}}.'
    );
    // The app renders the menu without an intl provider (console.error is spied in the setup).
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('React Intl'));
  });
});
