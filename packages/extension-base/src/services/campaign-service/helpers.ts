// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignVersion1, NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import NotificationService from '@subwallet/extension-base/services/notification-service/NotificationService';
import { t } from 'i18next';

export const runCampaignVersion1 = (notificationService: NotificationService, campaign: CampaignVersion1, onComplete: () => void) => {
  const { message, okText, title, url } = campaign.data;

  const onClick = () => {
    window.open(url);
    onComplete();
  };

  const onButtonClick = (btnIndex: number) => {
    if (btnIndex === 0) {
      onClick();
    }
  };

  notificationService.notify({
    type: NotificationType.SUCCESS,
    title: t(title),
    message: t(message),
    action: { buttonClick: onButtonClick, click: onClick },
    notifyViaBrowser: true,
    buttons: [{
      title: t(okText)
    }]
  });
};
