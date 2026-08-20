/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge, EuiBadgeGroup } from '@elastic/eui';
import {
  BACKEND_CHANNEL_TYPE,
  DEFAULT_EMPTY_DATA,
  MANAGED_CHANNEL_CATEGORY,
  MAX_CHANNELS_RESULT_SIZE,
  MONITOR_TYPE,
} from '../../../../../utils/constants';
import { getActionTypeFromAction } from '../../../../../utils/helpers';
import NotificationService from '../../../../../services/NotificationService';
import { getItemLevelType } from './helpers';

const NOT_APPLICABLE = '–';

const isActiveResponseAction = (action) => {
  try {
    return getActionTypeFromAction(action) === MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE;
  } catch (err) {
    return false; // an action saved before the categories existed
  }
};

// The active responses a monitor invokes live in the actions of its triggers
export const getMonitorActiveResponseIds = (monitor = {}) => {
  const ids = (monitor.triggers || []).flatMap((trigger) =>
    Object.values(trigger).flatMap((definition) =>
      (definition?.actions || [])
        .filter((action) => isActiveResponseAction(action) && action.destination_id)
        .map((action) => action.destination_id)
    )
  );

  return [...new Set(ids)];
};

// The trigger actions only hold ids, so the names are resolved once for the whole list
export const getActiveResponseNames = async (httpClient) => {
  const { items } = await new NotificationService(httpClient).getChannels({
    from_index: 0,
    max_items: MAX_CHANNELS_RESULT_SIZE,
    config_type: BACKEND_CHANNEL_TYPE.ACTIVE_RESPONSE,
    sort_field: 'name',
    sort_order: 'asc',
  });

  return Object.fromEntries(items.map(({ config_id: configId, name }) => [configId, name]));
};

/*
 * An Active Response monitor is armed by the active responses its triggers invoke, so the list
 * names them the way it already names the associations of a composite monitor. A response that no
 * longer exists is named by its id: a broken action is what the user most needs to see.
 */
export const getActiveResponseColumn = (activeResponseNames = {}) => ({
  field: 'item_type',
  name: 'Active responses',
  truncateText: false,
  render: (itemType, item) => {
    if (itemType !== MONITOR_TYPE.ACTIVE_RESPONSE) return NOT_APPLICABLE;

    const ids = getMonitorActiveResponseIds(item.monitor);
    if (!ids.length) return NOT_APPLICABLE;

    return (
      <EuiBadgeGroup gutterSize="xs">
        {ids.map((id) => (
          <EuiBadge key={id} color={activeResponseNames[id] ? 'hollow' : 'danger'}>
            {activeResponseNames[id] || `${id} (not found)`}
          </EuiBadge>
        ))}
      </EuiBadgeGroup>
    );
  },
});

// Monitor type options for the list filter, skipping the types the list does not name
export const getMonitorTypeOptions = () =>
  Object.values(MONITOR_TYPE)
    .map((monitorType) => ({ value: monitorType, text: getItemLevelType(monitorType) }))
    .filter(({ text }) => text !== DEFAULT_EMPTY_DATA);

// Placed next to the Type column, which is what it qualifies
export const withActiveResponseColumn = (columns, activeResponseNames) => {
  const withColumn = [...columns];
  withColumn.splice(
    withColumn.findIndex(({ field }) => field === 'item_type') + 1,
    0,
    getActiveResponseColumn(activeResponseNames)
  );

  return withColumn;
};
