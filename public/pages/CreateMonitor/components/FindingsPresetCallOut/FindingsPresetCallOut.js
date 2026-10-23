/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiCallOut, EuiCode } from '@elastic/eui';
import {
  FINDINGS_PRESET_CATEGORY,
  FINDINGS_PRESET_INDEX,
} from '../../containers/CreateMonitor/utils/findingsPreset';

/**
 * Wazuh: tells the user why the create monitor form is already filled in when it is opened from a
 * notification channel, and what the monitor covers.
 */
const FindingsPresetCallOut = ({ channelName, channelMuted = false }) =>
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
        This monitor sends a message to the channel when new high or critical findings arrive in the{' '}
        {FINDINGS_PRESET_CATEGORY} category (<EuiCode>{FINDINGS_PRESET_INDEX}</EuiCode>). It checks
        every minute. To watch another category, change the index. Review the settings and select
        Create.
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
        findings in the {FINDINGS_PRESET_CATEGORY} category. Select a channel in the trigger
        notification before you create it.
      </p>
    </EuiCallOut>
  );

FindingsPresetCallOut.propTypes = {
  channelName: PropTypes.string,
  channelMuted: PropTypes.bool,
};

export default FindingsPresetCallOut;
