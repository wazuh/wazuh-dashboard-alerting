/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem, EuiStat } from '@elastic/eui';
import './styles.scss';

/*
 * A row of read-only fields, each one a label over its value. Mirrors the ribbon the Wazuh
 * dashboard uses to summarize an agent. It is reimplemented here because that one belongs to
 * another plugin, and a plugin only reaches another through its declared contracts.
 *
 * It carries no panel of its own: it is meant to sit inside the one that already frames its
 * surroundings.
 */
const Ribbon = ({ items, 'data-test-subj': dataTestSubj }) => (
  <EuiFlexGroup data-test-subj={dataTestSubj} wrap justifyContent="spaceBetween">
    {items.map(({ key, label, value }) => (
      <EuiFlexItem key={key} grow={false} className="ribbon-item">
        <EuiStat
          title={value ?? '-'}
          description={label}
          titleSize="xs"
          data-test-subj={`ribbon-item-${key}`}
        />
      </EuiFlexItem>
    ))}
  </EuiFlexGroup>
);

Ribbon.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      value: PropTypes.node,
    })
  ).isRequired,
};

export default Ribbon;
