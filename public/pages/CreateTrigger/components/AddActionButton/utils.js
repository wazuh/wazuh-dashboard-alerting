/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DEFAULT_MESSAGE_SOURCE, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';
// Wazuh: build the default message of per document monitors over findings.
import { getDiscoverUrl, getFindingsMessageSource, isFindingsMonitor } from './findings-message';

// Wazuh: `indices` selects the findings default message for per document monitors.
// export const getInitialActionValues = ({ monitorType, flyoutMode, actions }) => {
// Wazuh: document the parameters, including the indices added to detect monitors over findings.
/**
 * @param {object} params
 * @param {string} params.monitorType
 * @param {boolean} [params.flyoutMode]
 * @param {object[]} [params.actions] actions of the trigger, used to name the new one
 * @param {Array<string|{label: string}>} [params.indices] Wazuh: indices of the monitor
 */
export const getInitialActionValues = ({ monitorType, flyoutMode, actions, indices }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);

  switch (monitorType) {
    case MONITOR_TYPE.BUCKET_LEVEL:
      _.set(
        initialActionValues,
        'message_template.source',
        DEFAULT_MESSAGE_SOURCE.BUCKET_LEVEL_MONITOR
      );
      break;
    case MONITOR_TYPE.QUERY_LEVEL:
    case MONITOR_TYPE.CLUSTER_METRICS:
      _.set(
        initialActionValues,
        'message_template.source',
        DEFAULT_MESSAGE_SOURCE.QUERY_LEVEL_MONITOR
      );
      break;
    // Wazuh: notifications about findings say which finding they are about and link to it.
    case MONITOR_TYPE.DOC_LEVEL:
    case MONITOR_TYPE.ACTIVE_RESPONSE:
      if (isFindingsMonitor(indices)) {
        _.set(
          initialActionValues,
          'message_template.source',
          getFindingsMessageSource(getDiscoverUrl())
        );
      }
      break;
  }

  const id = getDigitId();
  initialActionValues.id = `notification${id}`;

  // Add name based on previous name;
  if (flyoutMode) {
    initialActionValues.name = getUniqueName(actions, 'Notification ');
  }

  return initialActionValues;
};

export const getInitialPplActionValues = ({ flyoutMode, actions }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);

  // Set PPL-specific message template
  _.set(initialActionValues, 'message_template.source', DEFAULT_MESSAGE_SOURCE.PPL_MONITOR);

  const id = getDigitId();
  initialActionValues.id = `notification${id}`;

  // Add name based on previous name;
  if (flyoutMode) {
    initialActionValues.name = getUniqueName(actions, 'Notification ');
  }

  return initialActionValues;
};
