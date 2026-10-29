/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { EuiFlexGroup, EuiFlexItem, EuiIconTip } from '@elastic/eui';
import { getDataSourceQueryObj } from '../../../utils/helpers';

export const FINDING_NOT_STORED_TEXT =
  'The finding of this alert was not stored, so its document cannot be opened. Alerts raised ' +
  'before plugins.alerting.alert_finding_enabled was enabled have no stored finding.';

/**
 * Wazuh: the finding of an alert is only stored while `plugins.alerting.alert_finding_enabled` is
 * enabled, so the alerts raised before it was enabled have none. Their document is shown without
 * the link that opens the finding, and with a hint telling why.
 *
 * @param {object} alert
 * @param {object} httpClient
 * @param {node} children the link that opens the finding
 */
const AlertFindingLink = ({ alert, httpClient, children }) => {
  const findingId = _.get(alert, 'finding_ids.0');
  const [findingStored, setFindingStored] = useState(false);

  useEffect(() => {
    let mounted = true;
    // ponytail: one request per row, a batch lookup if the findings API ever filters by several IDs.
    httpClient
      .get('../api/alerting/findings/_search', {
        // The route requires every paging and sorting parameter.
        query: {
          id: findingId,
          from: 0,
          size: 1,
          search: '',
          sortField: 'timestamp',
          sortDirection: 'desc',
          ...getDataSourceQueryObj()?.query,
        },
      })
      .then((resp) => {
        if (mounted) setFindingStored(Boolean(resp?.ok && !_.isEmpty(resp.findings)));
      })
      .catch(() => {
        if (mounted) setFindingStored(false);
      });
    return () => {
      mounted = false;
    };
  }, [findingId]);

  if (findingStored) return children;

  const docId = _.split(_.get(alert, 'related_doc_ids.0', ''), '|')[0];
  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} wrap>
      <EuiFlexItem grow={false}>{docId}</EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiIconTip type="iInCircle" color="subdued" content={FINDING_NOT_STORED_TEXT} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default AlertFindingLink;
