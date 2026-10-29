/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  FINDINGS_PRESET,
  FINDINGS_PRESET_FALLBACK_INDEX,
  getFindingsPresetChannelId,
  getFindingsPresetIndices,
  getFindingsPresetMonitorName,
  getFindingsPresetValues,
  restoreFindingsPreset,
} from './findingsPreset';
import { FORMIK_INITIAL_VALUES, MATCH_ALL_QUERY } from './constants';
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

describe('getFindingsPresetIndices', () => {
  const httpClient = { post: jest.fn() };

  test('lists the data stream of every findings category', async () => {
    httpClient.post.mockResolvedValue({
      ok: true,
      resp: [
        { index: '.ds-wazuh-findings-v5-system-activity-000001' },
        { index: '.ds-wazuh-findings-v5-security-000001' },
        { index: '.ds-wazuh-findings-v5-security-000002' },
        { index: '.ds-wazuh-alerts-v5-000001' },
        // A plain index is not a findings category.
        { index: 'wazuh-findings-custom' },
      ],
    });

    expect(await getFindingsPresetIndices(httpClient)).toEqual([
      'wazuh-findings-v5-security',
      'wazuh-findings-v5-system-activity',
    ]);
    expect(httpClient.post).toHaveBeenCalledWith('../api/alerting/_indices', {
      body: JSON.stringify({ index: 'wazuh-findings*' }),
      query: undefined,
    });
  });

  test.each([
    ['no findings index exists', () => httpClient.post.mockResolvedValue({ ok: true, resp: [] })],
    ['the indices cannot be listed', () => httpClient.post.mockResolvedValue({ ok: false })],
    ['the request fails', () => httpClient.post.mockRejectedValue(new Error('Forbidden'))],
  ])('falls back to the security findings when %s', async (_description, mockResponse) => {
    mockResponse();

    expect(await getFindingsPresetIndices(httpClient)).toEqual([FINDINGS_PRESET_FALLBACK_INDEX]);
    expect(FINDINGS_PRESET_FALLBACK_INDEX).toBe('wazuh-findings-v5-security');
  });
});

describe('getFindingsPresetValues', () => {
  const indices = ['wazuh-findings-v5-security', 'wazuh-findings-v5-system-activity'];

  test('sets up a document level monitor over the findings indices', () => {
    const values = getFindingsPresetValues({ channelId: 'abc', channelName: 'SOC Slack', indices });

    expect(values).toMatchObject({
      name: 'SOC Slack: high and critical findings',
      monitor_type: MONITOR_TYPE.DOC_LEVEL,
      searchType: SEARCH_TYPE.GRAPH,
      index: [
        { label: 'wazuh-findings-v5-security' },
        { label: 'wazuh-findings-v5-system-activity' },
      ],
    });
  });

  test('watches the security findings when no indices are given', () => {
    expect(getFindingsPresetValues().index).toEqual([{ label: 'wazuh-findings-v5-security' }]);
  });

  test('builds the monitor the indexer receives', () => {
    const monitor = toMonitor(
      getFindingsPresetValues({ channelId: 'abc', channelName: 'SOC Slack', indices })
    );

    expect(monitor.monitor_type).toBe(MONITOR_TYPE.DOC_LEVEL);
    expect(monitor.schedule).toEqual({ period: { interval: 1, unit: 'MINUTES' } });
    expect(monitor.inputs[0].doc_level_input).toMatchObject({
      indices,
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

describe('restoreFindingsPreset', () => {
  test('puts the preset back and keeps the name and the schedule', () => {
    const presetValues = getFindingsPresetValues({ channelId: 'abc', channelName: 'SOC Slack' });
    // What selecting the Per query monitor card leaves in the form, after the user edited it.
    const changedValues = {
      ..._.cloneDeep(FORMIK_INITIAL_VALUES),
      ...presetValues,
      name: 'Edited name',
      period: { interval: 5, unit: 'MINUTES' },
      monitor_type: MONITOR_TYPE.QUERY_LEVEL,
      searchType: SEARCH_TYPE.GRAPH,
      index: [],
      query: MATCH_ALL_QUERY,
      triggerDefinitions: [],
    };

    const monitor = toMonitor(restoreFindingsPreset(changedValues, presetValues));
    const presetMonitor = toMonitor(presetValues);

    expect(monitor.name).toBe('Edited name');
    expect(monitor.schedule).toEqual({ period: { interval: 5, unit: 'MINUTES' } });
    expect(monitor.monitor_type).toBe(MONITOR_TYPE.DOC_LEVEL);
    expect(monitor.inputs).toEqual(presetMonitor.inputs);
    expect(monitor.triggers).toEqual(presetMonitor.triggers);
  });
});
