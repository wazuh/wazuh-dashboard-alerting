/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getInitialActionValues as getInitialNotificationsValues } from './utils';
import { FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';
import { NOTIFY_OPTIONS_VALUES } from '../Action/actions/Message';

const getInitialActiveResponseValues = ({ monitorType, flyoutMode, actions }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);

  initialActionValues.subject_template.source = 'Alerting Active Response action';
  initialActionValues.message_template.source = '';

  const id = getDigitId();
  initialActionValues.id = `activeResponse${id}`;

  // Add the action_action_execution_scope by alert
  // RESEARCH: this property is not part of the initial action values, and could be added by some forms
  // that are not present for the active response
  initialActionValues.action_execution_policy = {
    action_execution_scope: {
      [NOTIFY_OPTIONS_VALUES.PER_ALERT]: {
        'actionable_alerts': []
      }
    }
  }


  // Add name based on previous name;
  if (flyoutMode) {
    initialActionValues.name = getUniqueName(actions, 'Active Response ');
  }

  return initialActionValues;
}

export const getInitialActionValues = ({ monitorType, flyoutMode, actions, actionType = 'notification' }) => {
  
  switch (actionType) {
    case 'notification':{
      return getInitialNotificationsValues({ monitorType, flyoutMode, actions });
    }
    case 'active_response': {
      return getInitialActiveResponseValues({ monitorType, flyoutMode, actions });
    }
    default: {
      throw new Error(`Unknown action type: ${actionType}`);
    }
  }
  
};
