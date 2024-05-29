// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignAction, CampaignNotification, NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import NotificationService from '@subwallet/extension-base/services/notification-service/NotificationService';
import { t } from 'i18next';

export const runCampaign = (notificationService: NotificationService, campaign: CampaignNotification) => {
  const { action, message, metadata, title } = campaign.data;
  const { buttons } = campaign;

  const onClick = (action: CampaignAction, metadata: Record<string, any> | null) => {
    return () => {
      switch (action) {
        case 'open_url': {
          if (metadata) {
            const url = metadata.url as string | undefined;

            if (url) {
              chrome.tabs.create({ url }).catch(console.error);
            }
          }

          break;
        }

        default:
          break;
      }
    };
  };

  const onButtonClick = (btnIndex: number) => {
    const { metadata, type } = buttons[btnIndex];

    onClick(type, metadata)();
  };

  notificationService.notify({
    type: NotificationType.SUCCESS,
    title: t(title),
    message: t(message),
    action: { buttonClick: onButtonClick, click: onClick(action, metadata) },
    notifyViaBrowser: true,
    buttons: buttons.map((button) => ({ title: button.name }))
  });
};
