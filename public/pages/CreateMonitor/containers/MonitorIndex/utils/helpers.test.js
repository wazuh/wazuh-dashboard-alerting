/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDataStreamName } from './helpers';

describe('getDataStreamName', () => {
  test.each([
    ['.ds-wazuh-findings-v5-security-000001', 'wazuh-findings-v5-security'],
    ['.ds-wazuh-alerts-000012', 'wazuh-alerts'],
  ])('returns the data stream %s backs', (index, dataStream) => {
    expect(getDataStreamName(index)).toBe(dataStream);
  });

  test.each(['wazuh-findings-v5-security', '.kibana_1', '.ds-wazuh-findings'])(
    'returns undefined for %s, which is not a backing index',
    (index) => {
      expect(getDataStreamName(index)).toBeUndefined();
    }
  );
});
