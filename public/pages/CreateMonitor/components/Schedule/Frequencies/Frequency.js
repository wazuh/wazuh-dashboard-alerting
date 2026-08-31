/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'formik'; // Wazuh
import { FormikSelect } from '../../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../../utils/validate';
// Wazuh
import {
  ACTIVE_RESPONSE_MAX_INTERVAL_SECONDS,
  MONITOR_TYPE,
} from '../../../../../utils/constants';

const frequencies = [
  { value: 'interval', text: 'By interval' },
  { value: 'daily', text: 'Daily' },
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'cronExpression', text: 'Custom cron expression' },
];

const flyoutFrequencies = [
  { value: 'interval', text: 'By interval' },
  { value: 'daily', text: 'Daily' },
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
];

/*
 * Wazuh: the indexer only accepts an interval schedule for an Active Response monitor, so the other
 * frequencies are hidden. A monitor already saved with another one keeps its option, to not change
 * the schedule silently.
 */
const getFrequencies = ({ flyoutMode, monitorType, frequency }) => {
  const options = flyoutMode ? flyoutFrequencies : frequencies;
  if (monitorType !== MONITOR_TYPE.ACTIVE_RESPONSE) return options;
  return options.filter(({ value }) => value === 'interval' || value === frequency);
};

const Frequency = ({ flyoutMode, formik }) => (
  <FormikSelect
    name="frequency"
    formRow
    rowProps={{
      label: 'Frequency',
      // Wazuh
      helpText:
        formik.values.monitor_type === MONITOR_TYPE.ACTIVE_RESPONSE
          ? `Active Response monitors run on an interval of at most ${ACTIVE_RESPONSE_MAX_INTERVAL_SECONDS} seconds.`
          : undefined,
      isInvalid,
      error: hasError,
    }}
    inputProps={{
      // Wazuh
      options: getFrequencies({
        flyoutMode,
        monitorType: formik.values.monitor_type,
        frequency: formik.values.frequency,
      }),
      isInvalid,
      'data-test-subj': 'frequency_field',
    }}
  />
);

export default connect(Frequency); // Wazuh
