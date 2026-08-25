/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getItemLevelType, getURLQueryParams } from './helpers';
import { DEFAULT_QUERY_PARAMS } from './constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';

describe('Monitors/utils/helpers', () => {
  test('names the Active Response monitor type in sentence case, like its siblings', () => {
    expect(getItemLevelType(MONITOR_TYPE.ACTIVE_RESPONSE)).toBe('Active response');
  });

  test('reads the monitor type filter from the URL', () => {
    expect(getURLQueryParams({ search: '?monitorType=active_response_monitor' }).monitorType).toBe(
      MONITOR_TYPE.ACTIVE_RESPONSE
    );
    expect(getURLQueryParams({ search: '' }).monitorType).toBe(DEFAULT_QUERY_PARAMS.monitorType);
  });
});
