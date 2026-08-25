/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Toasts are placed over the primary action bar and outlive the form that raised them, so they end
 * up covering the Create button of the next form the user opens. A form wraps the notifications
 * service with this tracker and removes its own toasts when it is left.
 */
const TRACKED_TOAST_METHODS = ['addSuccess', 'addWarning', 'addDanger', 'addError'];

export const createToastTracker = (notifications) => {
  if (!notifications?.toasts) return { notifications, removeAll: () => {} };

  const raised = [];
  const toasts = Object.create(notifications.toasts);

  TRACKED_TOAST_METHODS.forEach((method) => {
    toasts[method] = (...args) => {
      const toast = notifications.toasts[method](...args);
      if (toast) raised.push(toast);
      return toast;
    };
  });

  const trackedNotifications = Object.create(notifications);
  trackedNotifications.toasts = toasts;

  return {
    notifications: trackedNotifications,
    removeAll: () => raised.splice(0).forEach((toast) => notifications.toasts.remove(toast)),
  };
};
