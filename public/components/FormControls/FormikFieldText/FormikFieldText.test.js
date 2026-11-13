/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, mount } from 'enzyme';
import { Formik } from 'formik';

import FormikFieldText from './FormikFieldText';

describe('FormikFieldText', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikFieldText name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('passes the event, field and form to a custom onBlur', () => {
    const onBlur = jest.fn();
    const wrapper = mount(
      <Formik initialValues={{ testing: '' }} onSubmit={jest.fn()}>
        <FormikFieldText name="testing" inputProps={{ onBlur }} />
      </Formik>
    );

    wrapper.find('input').simulate('blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
    const [, field, form] = onBlur.mock.calls[0];
    expect(field.name).toBe('testing');
    expect(form.setFieldTouched).toEqual(expect.any(Function));
  });
});
