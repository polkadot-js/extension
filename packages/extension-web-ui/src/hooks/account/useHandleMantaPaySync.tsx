// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { initSyncMantaPay, windowOpen } from '@subwallet/extension-web-ui/messaging';
import { Button } from '@subwallet/react-ui';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useNotification from '../common/useNotification';
import useIsPopup from '../dom/useIsPopup';

export default function useHandleMantaPaySync () {
  const notify = useNotification();
  const { t } = useTranslation();
  const isPopup = useIsPopup();
  const navigate = useNavigate();

  const onClose = useCallback(() => {
    notify({
      message: 'ZK assets are only available after sync',
      type: NotificationType.INFO
    });
  }, [notify]);

  return useCallback((address: string) => {
    const onOk = () => {
      initSyncMantaPay(address)
        .catch(console.error);

      if (isPopup) {
        windowOpen({
          allowedPath: '/accounts/detail',
          subPath: `/${address}`
        })
          .catch(console.warn);
      } else {
        navigate(`/accounts/detail/${address}`);
      }
    };

    const button: JSX.Element = (
      <div style={{
        display: 'flex',
        gap: '8px'
      }}
      >
        <Button
          // eslint-disable-next-line react/jsx-no-bind
          onClick={onOk}
          schema={'warning'}
          size={'xs'}
        >
          {t('Sync')}
        </Button>

        <Button
          onClick={onClose}
          schema={'secondary'}
          size={'xs'}
        >
          {t('Cancel')}
        </Button>
      </div>
    );

    notify({
      description: t('This may take a few minutes'),
      message: t('Sync ZK mode?'),
      type: NotificationType.WARNING,
      btn: button,
      duration: 3
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopup, notify, onClose, t]);
}
