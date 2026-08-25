/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'formik';

import CustomCron from './CustomCron';
import Daily from './Daily';
import Interval from './Interval';
import Monthly from './Monthly';
import Weekly from './Weekly';

const components = {
  daily: Daily,
  weekly: Weekly,
  monthly: Monthly,
  cronExpression: CustomCron,
  interval: Interval,
};

const FrequencyPicker = (props) => {
  const { frequency, monitor_type: monitorType } = props.formik.values;
  const Component = components[frequency];
  // Wazuh: the interval limits depend on the monitor type
  return <Component compressed monitorType={monitorType} />;
};

export default connect(FrequencyPicker);
