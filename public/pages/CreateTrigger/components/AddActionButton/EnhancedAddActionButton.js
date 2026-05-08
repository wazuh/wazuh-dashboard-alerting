/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton, EuiSmallButtonEmpty, EuiPanel } from '@elastic/eui';
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
        iconType="plusInCircle"
        className="add-action-button__flyout-button"
      >
        {buttonNotificationText}
      </EuiSmallButtonEmpty>
      {monitorType === MONITOR_TYPE.ACTIVE_RESPONSE && (
        <EuiSmallButtonEmpty
          onClick={onClickActiveResponse}
          iconType="plusInCircle"
          className="add-action-button__flyout-button"
        >
          {buttonActiveResponseText}
        </EuiSmallButtonEmpty>
      )}
    </EuiPanel>
  ) : (
    <>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '0 auto',
          maxWidth: '500px',
          justifyContent: 'center',
        }}
      >
        <EuiButton fill={false} size={'s'} onClick={onClickNotification}>
          {buttonNotificationText}
        </EuiButton>
        {monitorType === MONITOR_TYPE.ACTIVE_RESPONSE && (
          <EuiButton fill={false} size={'s'} onClick={onClickActiveResponse}>
            {buttonActiveResponseText}
          </EuiButton>
        )}
      </div>
    </>
  );
};

export default AddActionButton;
