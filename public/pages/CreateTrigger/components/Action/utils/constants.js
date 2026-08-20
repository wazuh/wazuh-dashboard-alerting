/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Every field in the action panel, and the summary of the selected active response, share one
 * measure so the panel reads as a single column. 400px is the width OUI gives a form control.
 */
export const ACTION_FIELD_WIDTH = 400;
export const ACTIVE_RESPONSE_SUMMARY_TITLE_WIDTH = '35%';

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
