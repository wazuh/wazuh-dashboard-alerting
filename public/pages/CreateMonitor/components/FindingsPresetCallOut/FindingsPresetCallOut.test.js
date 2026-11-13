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
    const { container } = render(
      <FindingsPresetCallOut
        channelName="SOC Slack"
        indices={['wazuh-findings-v5-security', 'wazuh-findings-v5-system-activity']}
      />
    );
    const callOut = findBySubj(container, 'findingsPresetCallOut');

    expect(callOut.textContent).toContain('Send findings to "SOC Slack"');
    expect(callOut.textContent).toContain('high or critical findings');
    expect(callOut.textContent).toContain('arrive in any of the 2 findings categories.');
    expect(callOut.textContent).toContain('edit the index');
    expect(findBySubj(container, 'findingsPresetChannelMuted')).toBeNull();
  });

  test('names the index when the monitor watches a single one', () => {
    const { container } = render(<FindingsPresetCallOut channelName="SOC Slack" />);

    expect(findBySubj(container, 'findingsPresetCallOut').textContent).toContain(
      'arrive in wazuh-findings-v5-security.'
    );
  });

  test('warns that a muted channel does not send messages', () => {
    const { container } = render(<FindingsPresetCallOut channelName="SOC Slack" channelMuted />);

    expect(findBySubj(container, 'findingsPresetCallOut').className).toContain('warning');
    expect(findBySubj(container, 'findingsPresetChannelMuted').textContent).toContain(
      'The channel is muted.'
    );
  });

  test('asks for another channel when the channel was not found', () => {
    const { container } = render(
      <FindingsPresetCallOut indices={['wazuh-findings-v5-security', 'wazuh-findings-v5-other']} />
    );
    const callOut = findBySubj(container, 'findingsPresetChannelNotFoundCallOut');

    expect(callOut.textContent).toContain('findings in any of the 2 findings categories.');
    expect(callOut.textContent).toContain('Select a channel in the trigger notification');
    expect(findBySubj(container, 'findingsPresetCallOut')).toBeNull();
  });
});
