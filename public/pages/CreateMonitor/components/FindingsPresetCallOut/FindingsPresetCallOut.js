/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiCallOut, EuiCode } from '@elastic/eui';
import { FINDINGS_PRESET_FALLBACK_INDEX } from '../../containers/CreateMonitor/utils/findingsPreset';

// Names the only index the monitor watches, or how many findings categories it covers.
const FindingsScope = ({ indices }) =>
  indices.length === 1 ? (
    <EuiCode>{indices[0]}</EuiCode>
  ) : (
    <>any of the {indices.length} findings categories</>
  );

/**
 * Wazuh: tells the user why the create monitor form is already filled in when it is opened from a
 * notification channel, and what the monitor covers.
 */
const FindingsPresetCallOut = ({
  channelName,
  channelMuted = false,
  indices = [FINDINGS_PRESET_FALLBACK_INDEX],
}) =>
  channelName ? (
    <EuiCallOut
      title={`Send findings to "${channelName}"`}
      iconType={channelMuted ? 'bellSlash' : 'bell'}
      color={channelMuted ? 'warning' : 'primary'}
      data-test-subj="findingsPresetCallOut"
    >
      {/* A monitor that sends to a muted channel stays silent, which is easy to miss later. */}
      {channelMuted && (
        <p data-test-subj="findingsPresetChannelMuted">
          <strong>The channel is muted.</strong> It does not send messages until you unmute it in
          Notifications.
        </p>
      )}
      <p>
        This monitor sends a message to the channel when new high or critical findings arrive in{' '}
        <FindingsScope indices={indices} />. It checks every minute. To change the findings it
        watches, edit the index. Review the settings and select Create.
      </p>
    </EuiCallOut>
  ) : (
    <EuiCallOut
      title="Channel not found"
      iconType="alert"
      color="warning"
      data-test-subj="findingsPresetChannelNotFoundCallOut"
    >
      <p>
        The channel might have been deleted. This monitor is set up for new high and critical
        findings in <FindingsScope indices={indices} />. Select a channel in the trigger
        notification before you create it.
      </p>
    </EuiCallOut>
  );

FindingsPresetCallOut.propTypes = {
  channelName: PropTypes.string,
  channelMuted: PropTypes.bool,
  indices: PropTypes.arrayOf(PropTypes.string),
};

export default FindingsPresetCallOut;
