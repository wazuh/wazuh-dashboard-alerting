/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import FindingsPresetCallOut from './FindingsPresetCallOut';

const findBySubj = (container, subj) => container.querySelector(`[data-test-subj="${subj}"]`);

describe('FindingsPresetCallOut', () => {
  test('describes what the monitor sends and where', () => {
    const { container } = render(<FindingsPresetCallOut channelName="SOC Slack" />);
    const callOut = findBySubj(container, 'findingsPresetCallOut');

    expect(callOut.textContent).toContain('Send findings to "SOC Slack"');
    expect(callOut.textContent).toContain('high or critical findings');
    expect(callOut.textContent).toContain('Security category (wazuh-findings-v5-security)');
    expect(callOut.textContent).toContain('change the index');
    expect(findBySubj(container, 'findingsPresetChannelMuted')).toBeNull();
  });

  test('warns that a muted channel does not send messages', () => {
    const { container } = render(<FindingsPresetCallOut channelName="SOC Slack" channelMuted />);

    expect(findBySubj(container, 'findingsPresetCallOut').className).toContain('warning');
    expect(findBySubj(container, 'findingsPresetChannelMuted').textContent).toContain(
      'The channel is muted.'
    );
  });

  test('asks for another channel when the channel was not found', () => {
    const { container } = render(<FindingsPresetCallOut />);

    expect(findBySubj(container, 'findingsPresetChannelNotFoundCallOut').textContent).toContain(
      'Select a channel in the trigger notification'
    );
    expect(findBySubj(container, 'findingsPresetCallOut')).toBeNull();
  });
});
