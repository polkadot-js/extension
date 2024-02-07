// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Notification, NotificationButton, NotificationParams } from '@subwallet/extension-base/background/KoniTypes';
import { isFirefox } from '@subwallet/extension-base/utils';
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
      NotificationService.createBrowserNotification(notification.title, notification.message, notification.action, notification.buttons);
    }
  }

  // Create a new chrome notification with link
  public static createBrowserNotification (title: string, message: string, action?: NotificationParams['action'], buttons?: NotificationButton[]): void {
    const link = action?.url;
    const onClick = action?.click;
    const onButtonClick = action?.buttonClick;

    const options: chrome.notifications.NotificationOptions<true> = {
      type: 'basic',
      title,
      message,
      iconUrl: '/images/icon-128.png',
      priority: 2,
      isClickable: !!link || !!onClick
    };

    if (!isFirefox) {
      options.buttons = buttons;
    }

    chrome?.notifications?.create(options, (notificationId: string) => {
      if (link || onClick) {
        chrome.notifications.onClicked.addListener((nId) => {
          if (nId === notificationId) {
            if (onClick) {
              onClick();
            } else {
              chrome.tabs.create({ url: link }).catch(console.error);
            }
          }
        });
      }

      if (onButtonClick) {
        chrome.notifications.onButtonClicked.addListener((nId, btnIndex) => {
          if (nId === notificationId) {
            onButtonClick(btnIndex);
          }
        });
      }
    });
  }
}
