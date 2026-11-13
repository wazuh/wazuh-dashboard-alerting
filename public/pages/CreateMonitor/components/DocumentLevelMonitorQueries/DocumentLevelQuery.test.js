/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Formik } from 'formik';
import DocumentLevelQuery from './DocumentLevelQuery';

describe('DocumentLevelQuery', () => {
  test('applies the typed query name to the form when the input blurs before the debounce fires', async () => {
    let formik;
    const query = { queryName: '', field: '', operator: 'is', query: '', tags: [] };
    const wrapper = mount(
      <Formik initialValues={{ queries: [query] }} onSubmit={jest.fn()}>
        {(props) => {
          formik = props;
          return (
            <DocumentLevelQuery
              formFieldName="queries[0]"
              query={query}
              queryIndex={0}
              dataTypes={{}}
            />
          );
        }}
      </Formik>
    );
    const input = wrapper.find('input[data-test-subj="documentLevelQuery_queryName0"]');

    input.simulate('change', { target: { value: 'q1' } });
    expect(formik.values.queries[0].queryName).toBe('');

    // Blur right away: the 500 ms debounce has not fired yet.
    await act(async () => {
      input.simulate('blur');
    });

    expect(formik.values.queries[0].queryName).toBe('q1');
    expect(formik.touched.queries[0].queryName).toBe(true);
    wrapper.unmount();
  });
});
