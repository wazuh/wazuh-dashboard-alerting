/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { INDEX, MAX_THROTTLE_VALUE, WRONG_THROTTLE_WARNING } from '../../utils/constants';
import { MONITOR_TYPE } from './constants';
import { TRIGGER_TYPE } from '../pages/CreateTrigger/containers/CreateTrigger/utils/constants';
import { getDataSourceQueryObj } from '../pages/utils/helpers';

// TODO: Use a validation framework to clean all of this up or create own.

export const isInvalid = (name, form) =>
  !!_.get(form.touched, name, false) && !!_.get(form.errors, name, false);

export const isInvalidWithoutTouch = (name, form) => !!_.get(form.errors, name, false);

export const hasError = (name, form) => _.get(form.errors, name);

export const validateActionName = (monitor, trigger) => (value) => {
  if (!value) return 'Required.';
  // GetMonitor is being used to retrieve the Trigger which means it will always
  // be wrapped in Trigger type (even for old Monitors)
  // TODO: Should clean this up later since a similar check is done in several places.
  // TODO: Expand on this validation by passing in triggerValues and comparing the current
  //  action's name with names of other actions in the trigger creation form.
  let actions;
  switch (monitor.monitor_type) {
    case MONITOR_TYPE.QUERY_LEVEL:
    case MONITOR_TYPE.CLUSTER_METRICS:
      actions = _.get(trigger, `${TRIGGER_TYPE.QUERY_LEVEL}.actions`, []);
      break;
    case MONITOR_TYPE.BUCKET_LEVEL:
      actions = _.get(trigger, `${TRIGGER_TYPE.BUCKET_LEVEL}.actions`, []);
      break;
    case MONITOR_TYPE.DOC_LEVEL:
    case MONITOR_TYPE.ACTIVE_RESPONSE: // Wazuh: Handle Active Response monitor type
      actions = _.get(trigger, `${TRIGGER_TYPE.DOC_LEVEL}.actions`, []);
      break;
  }
  if (!actions && trigger?.actions) {
    actions = trigger.actions;
  }
  actions = Array.isArray(actions) ? actions : [];
  const matches = actions.filter((action) => action.name === value);
  if (matches.length > 1) return 'Action name is already used.';
};

export const isInvalidActionThrottle = (action) => {
  if (_.get(action, 'throttle_enabled')) {
    var value = _.get(action, 'throttle.value');
    if (!value || value < 1 || value > MAX_THROTTLE_VALUE) {
      return true;
    }
  }
  return false;
};

export const validateActionThrottle = (action) => (value) => {
  if (isInvalidActionThrottle(action)) {
    return WRONG_THROTTLE_WARNING;
  }
};

export const required = (value) => {
  if (!value) return 'Required.';
};

export const requiredValidation = (text) => (value) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return text;
};

export const requiredNumber = (value) => {
  if (isNaN(parseFloat(value))) return 'Requires numerical value.';
};

export const validateIllegalCharacters =
  (illegalCharacters = ILLEGAL_CHARACTERS) =>
  (value) => {
    if (_.isEmpty(value)) return required(value);

    const illegalCharactersString = illegalCharacters.join(' ');
    let errorText = `Contains invalid characters. Cannot contain: ${illegalCharactersString}`;

    if (_.includes(illegalCharacters, ' ')) {
      errorText =
        illegalCharacters.length === 1
          ? 'Cannot contain spaces.'
          : `Contains invalid characters or spaces. Cannot contain: ${illegalCharactersString}`;
    }

    let includesIllegalCharacter = false;
    illegalCharacters.forEach((character) => {
      if (_.includes(value, character)) includesIllegalCharacter = true;
    });
    if (includesIllegalCharacter) return errorText;
  };

export const validateRequiredNumber = (value) => {
  if (value === undefined || typeof value === 'string') return 'Provide a value.';
};

export const isInvalidApiPath = (name, form) => {
  const path = _.get(form, `values.${name}`);
  return _.get(form.touched, name, false) && _.isEmpty(path);
};

export const validateMonitorName = (httpClient, monitorToEdit, isFullText) => async (value) => {
  try {
    const dataSourceQuery = getDataSourceQueryObj();
    if (!value) return isFullText ? 'Monitor name is required.' : 'Required.';
    const options = {
      index: INDEX.SCHEDULED_JOBS,
      query: { query: { term: { 'monitor.name.keyword': value } } },
    };
    const response = await httpClient.post('../api/alerting/monitors/_search', {
      body: JSON.stringify(options),
      query: dataSourceQuery?.query,
    });

    if (_.get(response, 'resp.hits.total.value', 0)) {
      if (!monitorToEdit) return 'Monitor name is already used.';
      if (monitorToEdit && monitorToEdit.name !== value) {
        return 'Monitor name is already used.';
      }
    }
    // TODO: Handle the situation that monitors with a same name can be created when user don't have the permission of 'cluster:admin/opendistro/alerting/monitor/search'
  } catch (err) {
    if (typeof err === 'string') throw err;
    throw 'There was a problem validating monitor name. Please try again.';
  }
};

export const validateTimezone = (value) => {
  if (!Array.isArray(value)) return 'Select a timezone.';
  if (!value.length) return 'Select a timezone.';
};

export const validatePositiveInteger = (value) => {
  if (!Number.isInteger(value) || value < 1) return 'Must be a positive integer.';
};

export const validateUnit = (value) => {
  if (!['MINUTES', 'HOURS', 'DAYS'].includes(value)) return 'Must be one of minutes, hours, days.';
};

export const validateMonthlyDay = (value) => {
  if (!Number.isInteger(value) || value < 1 || value > 31)
    return 'Must be a positive integer between 1-31.';
};

export const ILLEGAL_CHARACTERS = ['?', '"', ',', ' '];

export const validateDetector = (detectorId, selectedDetector) => {
  if (!detectorId) return 'Must select detector.';
  if (selectedDetector && selectedDetector.features.length === 0)
    return 'Must choose detector which has features.';
};

export const validateIndex = (options) => {
  if (!Array.isArray(options)) return 'Must specify an index.';
  if (!options.length) return 'Must specify an index.';

  const illegalCharacters = ILLEGAL_CHARACTERS.join(' ');
  const pattern = options.map(({ value, label }) => value || label).join('');
  if (!isIndexPatternQueryValid(pattern, ILLEGAL_CHARACTERS)) {
    return `One of your inputs contains invalid characters or spaces. Please omit: ${illegalCharacters}`;
  }
};

export function isIndexPatternQueryValid(pattern, illegalCharacters) {
  if (!pattern || !pattern.length) {
    return false;
  }

  if (pattern === '.' || pattern === '..') {
    return false;
  }

  return !illegalCharacters.some((char) => pattern.includes(char));
}

/**
 * Wazuh: validate that a date string is in a valid format
 * (ISO 8601, epoch ms, or OpenSearch date math) and can be parsed by OpenSearch.
 */
export const validateDate = (value) => {
  if (!value) return 'Required.';
  // OpenSearch date math: now, now-1d, now+1h/h, now/d, etc.
  if (/^now([+-]\d+[smhdwMy])?(\/[smhdwMy])?$/.test(value)) return undefined;
  // Epoch milliseconds or any date string parseable by the runtime (ISO 8601, RFC 2822, etc.)
  if (!isNaN(Date.parse(value))) return undefined;
  return 'Invalid date. Use ISO 8601 (2024-01-15T15:30:00), epoch ms, or date math (now-1d).';
};

/**
 * Wazuh: validate that an IP address is in a valid format (IPv4 or IPv6) and can be parsed by OpenSearch.
 */
export const validateIp = (value) => {
  if (!value) return 'Required.';
  const ipv4 =
    /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)(\/(\d|[1-2]\d|3[0-2]))?$/;
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/;
  if (ipv4.test(value) || ipv6.test(value)) return undefined;
  return 'Invalid IP address. Use IPv4 (192.168.1.1) or IPv6 format.';
};

export function validateExtractionQuery(value) {
  try {
    JSON.parse(value);
  } catch (err) {
    return 'Invalid JSON.';
  }
}
