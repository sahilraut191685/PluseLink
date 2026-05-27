// lib/notifications.js — Browser Push Notification helpers
'use client';

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission status
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

/**
 * Show a browser notification for a new emergency alert
 * @param {Object} data — Emergency alert data from socket
 */
export function showEmergencyNotification(data) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;

  const urgencyEmoji = data.urgency === 'critical' ? '🔴' : data.urgency === 'urgent' ? '🟡' : '🔵';
  const title = `${urgencyEmoji} ${data.urgency?.toUpperCase()} — ${data.bloodGroup} Blood Needed`;
  const body = `${data.unitsNeeded} unit(s) needed at ${data.hospital}.\n${data.distance ? `${data.distance} away • ` : ''}Respond now to save a life!`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `emergency-${data.requestId}`, // Prevents duplicate notifications
      requireInteraction: data.urgency === 'critical', // Critical stays until dismissed
      vibrate: [200, 100, 200, 100, 200], // Vibration pattern for mobile
      data: { requestId: data.requestId, url: `/donor/alert/${data.requestId}` },
    });

    // Click handler — navigate to the alert page
    notification.onclick = function () {
      window.focus();
      window.location.href = `/donor/alert/${data.requestId}`;
      notification.close();
    };

    // Auto-close after 30 seconds for non-critical
    if (data.urgency !== 'critical') {
      setTimeout(() => notification.close(), 30000);
    }

    return notification;
  } catch {
    return null;
  }
}

/**
 * Show a general notification
 * @param {string} title
 * @param {string} body
 * @param {Object} options
 */
export function showNotification(title, body, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      ...options,
    });

    if (options.onClick) {
      notification.onclick = options.onClick;
    }

    setTimeout(() => notification.close(), options.timeout || 10000);
    return notification;
  } catch {
    return null;
  }
}
