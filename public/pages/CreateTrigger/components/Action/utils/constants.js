/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Message from '../actions/index';

export const ActionsMap = {
  sns: {
    label: 'Amazon SNS notification',
    component: (props) => <Message {...props} />,
  },
  slack: {
    label: 'Slack notification',
    component: (props) => <Message {...props} />,
  },
  chime: {
    label: 'Amazon Chime notification',
    component: (props) => <Message {...props} />,
  },
  custom_webhook: {
    label: 'Custom webhook',
    component: (props) => <Message isSubjectDisabled {...props} />,
  },
  webhook: {
    label: 'Custom webhook',
    component: (props) => <Message isSubjectDisabled {...props} />,
  },
  email: {
    label: 'Email notification',
    component: (props) => <Message {...props} />,
  },
};

// 400px is the width OUI gives a form control, which every field in the action panel shares
export const ACTION_FIELD_WIDTH = 400;

// The configuration of an active response, as the notifications plugin stores it
export const ACTIVE_RESPONSE_LOCATION = Object.freeze({
  ALL: 'all',
  DEFINED_AGENT: 'defined-agent',
  LOCAL: 'local',
});

export const ACTIVE_RESPONSE_LOCATION_LABEL = Object.freeze({
  [ACTIVE_RESPONSE_LOCATION.ALL]: 'All agents',
  [ACTIVE_RESPONSE_LOCATION.DEFINED_AGENT]: 'Defined agent',
  [ACTIVE_RESPONSE_LOCATION.LOCAL]: 'Local',
});

export const ACTIVE_RESPONSE_TYPE = Object.freeze({
  STATELESS: 'stateless',
  STATEFUL: 'stateful',
});

export const ACTIVE_RESPONSE_TYPE_LABEL = Object.freeze({
  [ACTIVE_RESPONSE_TYPE.STATELESS]: 'Stateless',
  [ACTIVE_RESPONSE_TYPE.STATEFUL]: 'Stateful',
});
