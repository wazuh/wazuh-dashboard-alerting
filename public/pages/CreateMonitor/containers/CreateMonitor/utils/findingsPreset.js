/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Wazuh: preset that opens the create monitor form already set up to send new high and critical
 * findings to a notification channel. The Notifications plugin links here from a channel with
 * `#/create-monitor?preset=findings&channelId=<channel id>`.
 */

import _ from 'lodash';
import {
  ACTIVE_RESPONSE_FINDINGS_INDEX_PREFIX,
  MONITOR_TYPE,
  SEARCH_TYPE,
} from '../../../../../utils/constants';
import { FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES } from './constants';
import { AND_OR_CONDITION_OPTIONS } from '../../../../CreateTrigger/utils/constants';
import { getInitialTriggerValues } from '../../../../CreateTrigger/components/AddTriggerButton/utils';
import { getInitialActionValues } from '../../../../CreateTrigger/components/AddActionButton/enhanced-utils';
import { QUERY_IDENTIFIERS } from '../../../../CreateTrigger/containers/DefineDocumentLevelTrigger/DefineDocumentLevelTrigger';

export const FINDINGS_PRESET = 'findings';

/*
 * Findings are split in one data stream per category, and document level monitors do not support
 * index patterns, so the preset watches a single category: the Security one.
 */
export const FINDINGS_PRESET_INDEX = `${ACTIVE_RESPONSE_FINDINGS_INDEX_PREFIX}-v5-security`;
export const FINDINGS_PRESET_CATEGORY = 'Security';

// `wazuh.rule.level` is a keyword, so every severity is matched by its own query.
const SEVERITY_FIELD = 'wazuh.rule.level';
export const FINDINGS_PRESET_SEVERITIES = ['high', 'critical'];

const TRIGGER_NAME = 'High and critical findings';

/**
 * Returns the channel the preset sends findings to, or undefined when the URL does not ask for the
 * preset.
 *
 * @param {object} queryParams parsed query string of the create monitor route
 */
export const getFindingsPresetChannelId = ({ preset, channelId } = {}) =>
  preset === FINDINGS_PRESET && channelId ? channelId : undefined;

export const getFindingsPresetMonitorName = (channelName) =>
  channelName ? `${channelName}: high and critical findings` : TRIGGER_NAME;

/**
 * Builds the form values of a document level monitor that sends new high and critical findings to
 * a channel.
 *
 * @param {string} [channelId] channel of the notification action; left empty when the channel was
 * not found, so the user picks one
 * @param {string} [channelName] used to name the monitor and its action
 */
export const getFindingsPresetValues = ({ channelId = '', channelName } = {}) => {
  const queries = FINDINGS_PRESET_SEVERITIES.map((severity) => ({
    ..._.cloneDeep(FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES),
    queryName: `${severity}_severity`,
    field: SEVERITY_FIELD,
    query: severity,
  }));

  const action = getInitialActionValues({ monitorType: MONITOR_TYPE.DOC_LEVEL, actions: [] });
  action.name = channelName ? `Notify ${channelName}` : 'Notify channel';
  action.destination_id = channelId;

  const trigger = getInitialTriggerValues({ monitorType: MONITOR_TYPE.DOC_LEVEL, triggers: [] });
  trigger.name = TRIGGER_NAME;
  trigger.triggerConditions = queries.map((query, index) => ({
    ...(index > 0 && { andOrCondition: AND_OR_CONDITION_OPTIONS[1].value }),
    query: { ...query, expression: `${QUERY_IDENTIFIERS.NAME}${query.queryName}` },
  }));
  trigger.actions = [action];

  return {
    name: getFindingsPresetMonitorName(channelName),
    monitor_type: MONITOR_TYPE.DOC_LEVEL,
    searchType: SEARCH_TYPE.GRAPH,
    index: [{ label: FINDINGS_PRESET_INDEX }],
    queries,
    triggerDefinitions: [trigger],
  };
};
