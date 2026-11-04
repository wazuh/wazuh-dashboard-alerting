/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Formik } from 'formik';
import { InsertVariable, getMessageVariables, getVariableSnippet } from './insert-variable';

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

describe('InsertVariable', () => {
  test('inserts the selected variable in the message', async () => {
    let values;
    const wrapper = mount(
      <Formik initialValues={{ message: 'Hello ' }} onSubmit={jest.fn()}>
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

    expect(values.message).toBe('Hello {{ctx.monitor.name}}');
  });
});
