/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiCompressedFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPagination,
  EuiCompressedSelect,
} from '@elastic/eui';
// Wazuh
import { DEFAULT_QUERY_PARAMS } from '../../containers/Monitors/utils/constants';
import { getMonitorTypeOptions } from '../../containers/Monitors/utils/activeResponses';

const MONITOR_STATES = {
  ALL: 'all',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
};

const states = [
  { value: MONITOR_STATES.ALL, text: 'All states' },
  { value: MONITOR_STATES.ENABLED, text: 'Enabled' },
  { value: MONITOR_STATES.DISABLED, text: 'Disabled' },
];

// Wazuh: with a Type column present, a type filter makes each monitor type findable in a long list
const monitorTypes = [
  { value: DEFAULT_QUERY_PARAMS.monitorType, text: 'All types' },
  ...getMonitorTypeOptions(),
];

const MonitorControls = ({
  activePage,
  pageCount,
  search,
  state,
  monitorType,
  onSearchChange,
  onStateChange,
  onMonitorTypeChange,
  onPageClick,
  monitorActions = null,
}) => (
  <EuiFlexGroup style={{ padding: '0px 0px 16px' }} gutterSize="s">
    <EuiFlexItem>
      <EuiCompressedFieldSearch
        fullWidth={true}
        value={search}
        placeholder="Search"
        onChange={onSearchChange}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiCompressedSelect options={states} value={state} onChange={onStateChange} />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiCompressedSelect
        options={monitorTypes}
        value={monitorType}
        onChange={onMonitorTypeChange}
        data-test-subj="monitorTypeFilter"
      />
    </EuiFlexItem>
    {monitorActions && <EuiFlexItem grow={false}>{monitorActions}</EuiFlexItem>}
  </EuiFlexGroup>
);

export default MonitorControls;
