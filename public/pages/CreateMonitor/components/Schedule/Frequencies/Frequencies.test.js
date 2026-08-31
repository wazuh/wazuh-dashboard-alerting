/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { mount, render } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import Frequency from './Frequency';
import Interval from './Interval';
import Monthly from './Monthly';
import CustomCron from './CustomCron';
import FrequencyPicker from './FrequencyPicker';

describe('Frequencies', () => {
  test('renders Frequency', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Frequency />} />;

    expect(render(component)).toMatchSnapshot();
  });

  test('renders Interval', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Interval />} />;

    expect(render(component)).toMatchSnapshot();
  });

  test.skip('renders Monthly', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Monthly />} />;

    expect(render(component)).toMatchSnapshot();
  });

  test('renders CustomCron', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <CustomCron />} />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders FrequencyPicker', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <FrequencyPicker />} />
    );

    expect(render(component)).toMatchSnapshot();
  });

  // Wazuh: Active Response monitors only support a fixed interval of at most one minute
  describe('Active Response monitor', () => {
    const activeResponseValues = {
      ...FORMIK_INITIAL_VALUES,
      monitor_type: MONITOR_TYPE.ACTIVE_RESPONSE,
    };

    const mountWith = (values, Component) =>
      mount(<Formik initialValues={values} render={() => <Component />} />);

    test('offers the interval frequency only', () => {
      const wrapper = mountWith(activeResponseValues, Frequency);
      const { options } = wrapper.find('EuiCompressedSelect').first().props();

      expect(options).toEqual([{ value: 'interval', text: 'By interval' }]);
    });

    test('keeps the frequency an existing monitor was saved with', () => {
      const wrapper = mountWith(
        { ...activeResponseValues, frequency: 'cronExpression' },
        Frequency
      );
      const { options } = wrapper.find('EuiCompressedSelect').first().props();

      expect(options.map(({ value }) => value)).toEqual(['interval', 'cronExpression']);
    });

    test('offers seconds and minutes, each capped at 60 seconds', () => {
      const wrapper = mountWith(activeResponseValues, FrequencyPicker);

      expect(wrapper.find('EuiCompressedSelect').first().props().options).toEqual([
        { value: 'SECONDS', text: 'Second(s)' },
        { value: 'MINUTES', text: 'Minute(s)' },
      ]);
      expect(wrapper.find('EuiCompressedFieldNumber').first().props().max).toBe(1);
    });

    test('raises the interval cap when the schedule is expressed in seconds', () => {
      const wrapper = mountWith(
        { ...activeResponseValues, period: { interval: 30, unit: 'SECONDS' } },
        FrequencyPicker
      );

      expect(wrapper.find('EuiCompressedFieldNumber').first().props().max).toBe(60);
    });

    test('leaves the other monitor types alone', () => {
      const wrapper = mountWith(FORMIK_INITIAL_VALUES, FrequencyPicker);

      expect(wrapper.find('EuiCompressedSelect').first().props().options).toHaveLength(3);
      expect(wrapper.find('EuiCompressedFieldNumber').first().props().max).toBeUndefined();
    });
  });
});
