/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'formik'; // Wazuh
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { FormikFieldNumber, FormikSelect } from '../../../../../components/FormControls';
import {
  isInvalid,
  hasError,
  validateActiveResponseInterval,
  validateActiveResponseUnit,
  validatePositiveInteger,
  validateUnit,
} from '../../../../../utils/validate';
// Wazuh
import { ACTIVE_RESPONSE_MAX_INTERVAL, MONITOR_TYPE } from '../../../../../utils/constants';

export const unitOptions = [
  { value: 'MINUTES', text: 'Minute(s)' },
  { value: 'HOURS', text: 'Hours' },
  { value: 'DAYS', text: 'Days' },
];

export const unitToLabel = unitOptions.reduce(
  (acc, cur) => ({
    ...acc,
    [cur.value]: cur.text,
  }),
  {}
);

/*
 * Wazuh: the indexer caps an Active Response monitor schedule at 60 seconds, so hours and days
 * never apply and seconds become useful. The cap itself depends on the unit in use.
 */
const isActiveResponse = (monitorType) => monitorType === MONITOR_TYPE.ACTIVE_RESPONSE;
const activeResponseUnitOptions = [
  { value: 'SECONDS', text: 'Second(s)' },
  ...unitOptions.filter(({ value }) => value === 'MINUTES'),
];

const Interval = ({ monitorType, formik }) => (
  <EuiFlexGroup alignItems="flexStart" gutterSize="m">
    <EuiFlexItem>
      <FormikFieldNumber
        name="period.interval"
        formRow
        fieldProps={{
          validate: isActiveResponse(monitorType)
            ? validateActiveResponseInterval(formik.values.period?.unit)
            : validatePositiveInteger,
        }}
        rowProps={{
          label: 'Run every',
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          icon: 'clock',
          min: 1,
          max: isActiveResponse(monitorType)
            ? ACTIVE_RESPONSE_MAX_INTERVAL[formik.values.period?.unit]
            : undefined,
          'data-test-subj': 'interval_interval_field',
        }}
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <FormikSelect
        name="period.unit"
        formRow
        fieldProps={{
          validate: isActiveResponse(monitorType) ? validateActiveResponseUnit : validateUnit,
        }}
        rowProps={{
          hasEmptyLabelSpace: true,
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          options: isActiveResponse(monitorType) ? activeResponseUnitOptions : unitOptions,
          'data-test-subj': 'interval_unit_field',
        }}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default connect(Interval); // Wazuh
