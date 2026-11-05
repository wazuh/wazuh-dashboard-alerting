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
  getMessageVariables,
  getVariableSnippet,
  insertText,
} from './insert-variable';

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
  ])('inserts the text %s', (_description, text, selection, expected) => {
    const { value, cursor } = insertText(text, '{{x}}', selection);
    expect(value).toBe(expected);
    expect(value.slice(0, cursor).endsWith('{{x}}')).toBe(true);
  });
});

describe('InsertVariable', () => {
  test('inserts the selected variable in the message', async () => {
    let values;
    const wrapper = mount(
      <Formik initialValues={{ message: 'Hello' }} onSubmit={jest.fn()}>
        {(formik) => {
          values = formik.values;
          return <InsertVariable name="message" textAreaRef={{ current: null }} />;
        }}
      </Formik>
    );

    wrapper.find('button[data-test-subj="insertMessageVariableButton"]').simulate('click');
    wrapper.update();
    await act(async () => {
      wrapper.find('button[data-test-subj="insertMessageVariable-monitorName"]').simulate('click');
    });

    expect(values.message).toBe('Hello\n{{ctx.monitor.name}}');
  });

  test('explains how to print another field of the finding', () => {
    const wrapper = mount(
      <Formik initialValues={{ message: '' }} onSubmit={jest.fn()}>
        {() => <InsertVariable name="message" textAreaRef={{ current: null }} />}
      </Formik>
    );

    wrapper.find('button[data-test-subj="insertMessageVariableButton"]').simulate('click');
    wrapper.update();

    expect(wrapper.find('EuiPopoverFooter').text()).toBe(
      'For another field of the finding, write {{_source.<field>}} inside {{#sample_documents}}.'
    );
    // The app renders the menu without an intl provider (console.error is spied in the setup).
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('React Intl'));
  });
});
