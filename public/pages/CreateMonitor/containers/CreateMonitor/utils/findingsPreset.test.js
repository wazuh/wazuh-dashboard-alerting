/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  FINDINGS_PRESET,
  FINDINGS_PRESET_INDEX,
  getFindingsPresetChannelId,
  getFindingsPresetMonitorName,
  getFindingsPresetValues,
} from './findingsPreset';
import { FORMIK_INITIAL_VALUES } from './constants';
import { formikToMonitor } from './formikToMonitor';
import { formikToTrigger } from '../../../../CreateTrigger/containers/CreateTrigger/utils/formikToTrigger';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../../CreateTrigger/containers/CreateTrigger/utils/constants';

// Converts the preset the same way the create monitor form does when it is submitted.
const toMonitor = (presetValues) => {
  const values = { ..._.cloneDeep(FORMIK_INITIAL_VALUES), ...presetValues };
  const monitor = formikToMonitor(values);
  return { ...monitor, triggers: formikToTrigger(values, monitor.ui_metadata) };
};

describe('getFindingsPresetChannelId', () => {
  test('returns the channel when the URL asks for the findings preset', () => {
    expect(getFindingsPresetChannelId({ preset: FINDINGS_PRESET, channelId: 'abc' })).toBe('abc');
  });

  test.each([
    [{}],
    [{ channelId: 'abc' }],
    [{ preset: FINDINGS_PRESET }],
    [{ preset: 'other', channelId: 'abc' }],
    [undefined],
  ])('returns undefined for %j', (queryParams) => {
    expect(getFindingsPresetChannelId(queryParams)).toBeUndefined();
  });
});

describe('getFindingsPresetMonitorName', () => {
  test('names the monitor after its channel', () => {
    expect(getFindingsPresetMonitorName('SOC Slack')).toBe('SOC Slack: high and critical findings');
  });

  test('falls back to what the monitor sends when the channel is unknown', () => {
    expect(getFindingsPresetMonitorName()).toBe('High and critical findings');
  });
});

describe('getFindingsPresetValues', () => {
  test('sets up a document level monitor over the security findings', () => {
    const values = getFindingsPresetValues({ channelId: 'abc', channelName: 'SOC Slack' });

    expect(values).toMatchObject({
      name: 'SOC Slack: high and critical findings',
      monitor_type: MONITOR_TYPE.DOC_LEVEL,
      searchType: SEARCH_TYPE.GRAPH,
      index: [{ label: 'wazuh-findings-v5-security' }],
    });
    expect(FINDINGS_PRESET_INDEX).toBe('wazuh-findings-v5-security');
  });

  test('builds the monitor the indexer receives', () => {
    const monitor = toMonitor(
      getFindingsPresetValues({ channelId: 'abc', channelName: 'SOC Slack' })
    );

    expect(monitor.monitor_type).toBe(MONITOR_TYPE.DOC_LEVEL);
    expect(monitor.schedule).toEqual({ period: { interval: 1, unit: 'MINUTES' } });
    expect(monitor.inputs[0].doc_level_input).toMatchObject({
      indices: ['wazuh-findings-v5-security'],
      queries: [
        { name: 'high_severity', query: 'wazuh.rule.level:"high"', tags: [] },
        { name: 'critical_severity', query: 'wazuh.rule.level:"critical"', tags: [] },
      ],
    });

    expect(monitor.triggers).toHaveLength(1);
    const trigger = monitor.triggers[0][TRIGGER_TYPE.DOC_LEVEL];
    expect(trigger.name).toBe('High and critical findings');
    expect(trigger.condition.script.source).toBe(
      'query[name=high_severity] || query[name=critical_severity]'
    );
    expect(trigger.actions).toHaveLength(1);
    expect(trigger.actions[0]).toMatchObject({ name: 'Notify SOC Slack', destination_id: 'abc' });
  });

  test('leaves the channel for the user to select when it was not found', () => {
    const values = getFindingsPresetValues();
    const action = values.triggerDefinitions[0].actions[0];

    expect(values.name).toBe('High and critical findings');
    expect(action.destination_id).toBe('');
    expect(action.id).toMatch(/^notification/);
  });
});
