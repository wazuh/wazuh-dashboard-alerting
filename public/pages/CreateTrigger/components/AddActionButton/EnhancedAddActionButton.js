/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSmallButtonEmpty,
  EuiPanel,
  EuiText,
} from '@elastic/eui';
import { getInitialActionValues } from './enhanced-utils';
import { MANAGED_CHANNEL_CATEGORY, MONITOR_TYPE } from '../../../../utils/constants';
import './styles.scss';

const AddActionButton = ({
  arrayHelpers,
  numActions,
  flyoutMode,
  onPostAdd,
  values,
  fieldPath,
}) => {
  const buttonNotificationText = 'Add notification';
  const buttonActiveResponseText = 'Add active response';
  // Telling someone and changing the state of a machine are different decisions
  const notificationHelpText = 'Send an alert to a channel.';
  const activeResponseHelpText = 'Run a command on the affected agent.';
  const notificationIcon = 'bell';
  const activeResponseIcon = 'console';
  const monitorType = _.get(arrayHelpers, 'form.values.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
  const onClickNotification = () => {
    const actions = _.get(values, `${fieldPath}actions`, []);
    const initialValues = getInitialActionValues({
      monitorType,
      flyoutMode,
      actions,
      actionType: MANAGED_CHANNEL_CATEGORY.NOTIFICATION,
    });
    arrayHelpers.push(initialValues);

    if (onPostAdd) {
      onPostAdd(initialValues);
    }
  };

  const onClickActiveResponse = () => {
    const actions = _.get(values, `${fieldPath}actions`, []);
    const initialValues = getInitialActionValues({
      monitorType,
      flyoutMode,
      actions,
      actionType: MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE,
    });
    arrayHelpers.push(initialValues);

    if (onPostAdd) {
      onPostAdd(initialValues);
    }
  };

  return flyoutMode ? (
    <EuiPanel paddingSize="none">
      <EuiSmallButtonEmpty
        onClick={onClickNotification}
        iconType={notificationIcon}
        className="add-action-button__flyout-button"
      >
        {buttonNotificationText}
      </EuiSmallButtonEmpty>
      {monitorType === MONITOR_TYPE.ACTIVE_RESPONSE && (
        <EuiSmallButtonEmpty
          onClick={onClickActiveResponse}
          iconType={activeResponseIcon}
          className="add-action-button__flyout-button"
        >
          {buttonActiveResponseText}
        </EuiSmallButtonEmpty>
      )}
    </EuiPanel>
  ) : (
    <EuiFlexGroup
      gutterSize="m"
      justifyContent="center"
      style={{ margin: '0 auto', maxWidth: '500px' }}
    >
      <EuiFlexItem grow={false}>
        <EuiButton
          fill={false}
          size={'s'}
          iconType={notificationIcon}
          onClick={onClickNotification}
        >
          {buttonNotificationText}
        </EuiButton>
        <EuiText size="xs" color="subdued" textAlign="center">
          {notificationHelpText}
        </EuiText>
      </EuiFlexItem>
      {monitorType === MONITOR_TYPE.ACTIVE_RESPONSE && (
        <EuiFlexItem grow={false}>
          <EuiButton
            fill={false}
            size={'s'}
            iconType={activeResponseIcon}
            onClick={onClickActiveResponse}
          >
            {buttonActiveResponseText}
          </EuiButton>
          <EuiText size="xs" color="subdued" textAlign="center">
            {activeResponseHelpText}
          </EuiText>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

export default AddActionButton;
