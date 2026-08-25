/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
import Ribbon from '../../../../../components/Ribbon';
import { MANAGED_CHANNEL_CATEGORY } from '../../../../../utils/constants';
import { getManageChannelsUrl } from '../../../../../utils/helpers';
import {
  ACTIVE_RESPONSE_LOCATION,
  ACTIVE_RESPONSE_LOCATION_LABEL,
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
    <div>
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
      {/* a callout above needs a little more room than the gap between two callouts */}
      {(targetsEveryAgent || isMuted) && <EuiSpacer size="s" />}
      <Ribbon
        data-test-subj="activeResponseSummary"
        items={[
          ...(description
            ? [{ key: 'description', label: 'Description', value: description }]
            : []),
          {
            key: 'executable',
            label: 'Executable',
            value: [executable, extraArgs].filter(Boolean).join(' '),
          },
          { key: 'type', label: 'Type', value: getActiveResponseTypeDescription(activeResponse) },
          {
            key: 'location',
            label: 'Location',
            value: getActiveResponseLocationDescription(activeResponse),
          },
        ]}
      />
    </div>
  );
};

export default ActiveResponseSummary;
