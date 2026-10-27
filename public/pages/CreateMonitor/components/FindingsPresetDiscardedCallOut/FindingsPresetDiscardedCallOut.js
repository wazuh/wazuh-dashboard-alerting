/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiCallOut, EuiSmallButton } from '@elastic/eui';

/**
 * Wazuh: replaces the findings preset callout when the user changes the monitor type, since the
 * change removes the preset, and offers to put it back.
 */
const FindingsPresetDiscardedCallOut = ({ channelName, onRestore }) => (
  <EuiCallOut
    title="The findings preset only works with Per document monitors"
    iconType="alert"
    color="warning"
    data-test-subj="findingsPresetDiscardedCallOut"
  >
    <p>
      Changing the monitor type removed the findings index, the severity queries and the
      notification {channelName ? `to "${channelName}"` : 'of the trigger'}. Restore the preset to
      send new high and critical findings to the channel. The name and the schedule are kept.
    </p>
    <EuiSmallButton onClick={onRestore} data-test-subj="findingsPresetRestoreButton">
      Restore preset
    </EuiSmallButton>
  </EuiCallOut>
);

FindingsPresetDiscardedCallOut.propTypes = {
  channelName: PropTypes.string,
  onRestore: PropTypes.func.isRequired,
};

export default FindingsPresetDiscardedCallOut;
