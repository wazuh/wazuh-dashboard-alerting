/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiDescriptionList, EuiLink, EuiPanel, EuiSpacer } from '@elastic/eui';
import { MANAGED_CHANNEL_CATEGORY } from '../../../../../utils/constants';
import { getManageChannelsUrl } from '../../../../../utils/helpers';
import {
  ACTION_FIELD_WIDTH,
  ACTIVE_RESPONSE_LOCATION,
  ACTIVE_RESPONSE_LOCATION_LABEL,
  ACTIVE_RESPONSE_SUMMARY_TITLE_WIDTH,
  ACTIVE_RESPONSE_TYPE,
  ACTIVE_RESPONSE_TYPE_LABEL,
} from '../utils/constants';

export const getActiveResponseTypeDescription = ({ type, stateful_timeout: statefulTimeout }) => {
  const label = ACTIVE_RESPONSE_TYPE_LABEL[type];
  if (!label) return '-';
  if (type !== ACTIVE_RESPONSE_TYPE.STATEFUL || !statefulTimeout) return label;
  return `${label} · reverted after ${statefulTimeout} seconds`;
};

export const getActiveResponseLocationDescription = ({ location, agent_id: agentId }) => {
  const label = ACTIVE_RESPONSE_LOCATION_LABEL[location];
  if (!label) return '-';
  if (location !== ACTIVE_RESPONSE_LOCATION.DEFINED_AGENT || !agentId) return label;
  return `${label} · ${agentId}`;
};

const ActiveResponseSummary = ({ selectedDestination }) => {
  const activeResponse = selectedDestination?.activeResponse;
  if (!activeResponse) return null;

  const { description } = selectedDestination;
  const { executable, extra_args: extraArgs, location } = activeResponse;
  const isMuted = selectedDestination.isEnabled === false;
  const targetsEveryAgent = location === ACTIVE_RESPONSE_LOCATION.ALL;

  return (
    <div style={{ maxWidth: ACTION_FIELD_WIDTH }}>
      {targetsEveryAgent && (
        <>
          <EuiCallOut
            title="Runs on every agent in the environment"
            color="warning"
            iconType="alert"
            size="s"
          >
            <p>Confirm the monitor query is narrow enough before saving.</p>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}
      {isMuted && (
        <>
          <EuiCallOut title="This response is muted" color="warning" iconType="alert" size="s">
            <p>
              It will be saved to the trigger but will not execute until it is unmuted.{' '}
              <EuiLink
                href={getManageChannelsUrl(MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE)}
                target="_blank"
                external
              >
                Unmute in Active responses
              </EuiLink>
            </p>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}
      <EuiPanel color="subdued" paddingSize="m">
        <EuiDescriptionList
          compressed
          type="responsiveColumn"
          titleProps={{ style: { width: ACTIVE_RESPONSE_SUMMARY_TITLE_WIDTH } }}
          listItems={[
            ...(description ? [{ title: 'Description', description }] : []),
            {
              title: 'Executable',
              description: [executable, extraArgs].filter(Boolean).join(' ') || '-',
            },
            { title: 'Type', description: getActiveResponseTypeDescription(activeResponse) },
            {
              title: 'Location',
              description: getActiveResponseLocationDescription(activeResponse),
            },
          ]}
        />
      </EuiPanel>
    </div>
  );
};

export default ActiveResponseSummary;
