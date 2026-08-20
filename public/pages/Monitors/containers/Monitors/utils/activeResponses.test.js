/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getActiveResponseColumn,
  getMonitorActiveResponseIds,
  getMonitorTypeOptions,
} from './activeResponses';
import { getItemLevelType } from './helpers';
import { DEFAULT_EMPTY_DATA, MONITOR_TYPE } from '../../../../../utils/constants';

const renderColumn = (item, names) => {
  const { render } = getActiveResponseColumn(names);
  return render(item.item_type, item);
};

const activeResponseMonitor = (destinationId) => ({
  item_type: MONITOR_TYPE.ACTIVE_RESPONSE,
  monitor: {
    triggers: [
      {
        document_level_trigger: {
          actions: [{ id: 'activeResponse1', destination_id: destinationId }],
        },
      },
    ],
  },
});

describe('Monitors/utils/activeResponses', () => {
  describe('getMonitorActiveResponseIds', () => {
    test('collects the active responses of every trigger, without duplicates', () => {
      const monitor = {
        triggers: [
          {
            document_level_trigger: {
              actions: [
                { id: 'activeResponse1', destination_id: 'ar-1' },
                { id: 'notification1', destination_id: 'channel-1' },
              ],
            },
          },
          {
            document_level_trigger: {
              actions: [
                { id: 'activeResponse2', destination_id: 'ar-1' },
                { id: 'activeResponse3', destination_id: 'ar-2' },
              ],
            },
          },
        ],
      };

      expect(getMonitorActiveResponseIds(monitor)).toEqual(['ar-1', 'ar-2']);
    });

    test('returns an empty list when there is nothing to collect', () => {
      expect(getMonitorActiveResponseIds()).toEqual([]);
      expect(getMonitorActiveResponseIds({})).toEqual([]);
      expect(getMonitorActiveResponseIds({ triggers: [{ query_level_trigger: {} }] })).toEqual([]);
    });

    test('ignores active response actions without a selected response', () => {
      const monitor = {
        triggers: [{ document_level_trigger: { actions: [{ id: 'activeResponse1' }] } }],
      };

      expect(getMonitorActiveResponseIds(monitor)).toEqual([]);
    });
  });

  describe('getMonitorTypeOptions', () => {
    test('offers every monitor type the list can name', () => {
      const options = getMonitorTypeOptions();

      expect(options).toContainEqual({
        value: MONITOR_TYPE.ACTIVE_RESPONSE,
        text: getItemLevelType(MONITOR_TYPE.ACTIVE_RESPONSE),
      });
      expect(options.every(({ text }) => text !== DEFAULT_EMPTY_DATA)).toBe(true);
    });
  });

  describe('getActiveResponseColumn', () => {
    test('names the active responses the monitor invokes', () => {
      expect(renderColumn(activeResponseMonitor('ar-1'), { 'ar-1': 'Block-IP' })).toBe('Block-IP');
    });

    test('flags an active response that no longer exists', () => {
      expect(renderColumn(activeResponseMonitor('ar-1'), {})).toBe('ar-1 (not found)');
    });

    test('does not apply to the other monitor types', () => {
      expect(renderColumn({ item_type: MONITOR_TYPE.QUERY_LEVEL, monitor: {} }, {})).toBe('\u2013');
    });

    test('says nothing when the monitor invokes no active response', () => {
      expect(renderColumn({ item_type: MONITOR_TYPE.ACTIVE_RESPONSE, monitor: {} }, {})).toBe(
        '\u2013'
      );
    });
  });
});
