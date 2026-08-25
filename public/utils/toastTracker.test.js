/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createToastTracker } from './toastTracker';

describe('createToastTracker', () => {
  const getNotifications = () => ({
    toasts: {
      addSuccess: jest.fn((toast) => ({ id: toast })),
      addDanger: jest.fn((toast) => ({ id: toast })),
      remove: jest.fn(),
    },
  });

  test('removes only the toasts it raised', () => {
    const notifications = getNotifications();
    const tracker = createToastTracker(notifications);

    tracker.notifications.toasts.addSuccess('created');
    tracker.notifications.toasts.addDanger('failed');
    notifications.toasts.addSuccess('raised elsewhere');
    tracker.removeAll();

    expect(notifications.toasts.remove).toHaveBeenCalledTimes(2);
    expect(notifications.toasts.remove).toHaveBeenCalledWith({ id: 'created' });
    expect(notifications.toasts.remove).toHaveBeenCalledWith({ id: 'failed' });
  });

  test('removes each toast once', () => {
    const notifications = getNotifications();
    const tracker = createToastTracker(notifications);

    tracker.notifications.toasts.addSuccess('created');
    tracker.removeAll();
    tracker.removeAll();

    expect(notifications.toasts.remove).toHaveBeenCalledTimes(1);
  });

  test('does nothing without a notifications service', () => {
    expect(() => createToastTracker(undefined).removeAll()).not.toThrow();
  });
});
