/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FindingsPresetDiscardedCallOut from './FindingsPresetDiscardedCallOut';

const findBySubj = (container, subj) => container.querySelector(`[data-test-subj="${subj}"]`);

describe('FindingsPresetDiscardedCallOut', () => {
  test('explains what changing the monitor type removed', () => {
    const { container } = render(
      <FindingsPresetDiscardedCallOut channelName="SOC Slack" onRestore={jest.fn()} />
    );
    const callOut = findBySubj(container, 'findingsPresetDiscardedCallOut');

    expect(callOut.textContent).toContain('only works with Per document monitors');
    expect(callOut.textContent).toContain('the notification to "SOC Slack"');
  });

  test('does not name a channel that was not found', () => {
    const { container } = render(<FindingsPresetDiscardedCallOut onRestore={jest.fn()} />);

    expect(findBySubj(container, 'findingsPresetDiscardedCallOut').textContent).toContain(
      'the notification of the trigger'
    );
  });

  test('restores the preset', () => {
    const onRestore = jest.fn();
    const { container } = render(
      <FindingsPresetDiscardedCallOut channelName="SOC Slack" onRestore={onRestore} />
    );

    fireEvent.click(findBySubj(container, 'findingsPresetRestoreButton'));

    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
