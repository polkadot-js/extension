// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export default class NotificationService {// Create a new chrome notification with link
  public static createNotification (title: string, message: string, link?: string): void {
    chrome.notifications.create({
      type: 'basic',
      title,
      message,
      iconUrl: 'https://subwallet.app/assets/images/favicon/favicon-192x192.png',
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
