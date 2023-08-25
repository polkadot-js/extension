// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Notification, NotificationParams } from '@subwallet/extension-base/background/KoniTypes';
import { BehaviorSubject } from 'rxjs';

export default class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification[]>([]);

  public getNotificationSubject () {
    return this.notificationSubject;
  }

  public notify (notification: NotificationParams) {
    const now = new Date().getTime();
    // Get values in last 30 seconds only
    const notifications = this.notificationSubject.value.filter((n) => n.id < (now - 30000));

    // Push notification
    notifications.push({ ...notification, id: now });
    this.notificationSubject.next(notifications);

    if (notification.notifyViaBrowser) {
      NotificationService.createBrowserNotification(notification.title, notification.message, notification?.action?.url);
    }
  }

  // Create a new chrome notification with link
  public static createBrowserNotification (title: string, message: string, link?: string): void {
    chrome?.notifications?.create({
      type: 'basic',
      title,
      message,
      iconUrl: '/images/icon-128.png',
      priority: 2,
      isClickable: !!link
    }, (notificationId: string) => {
      if (link) {
        chrome.notifications.onClicked.addListener((nId) => {
          if (nId === notificationId) {
            window.open(link);
          }
        });
      }
    });
  }
}
