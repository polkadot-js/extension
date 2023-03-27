// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainConnectionStatus } from '@subwallet/extension-base/services/chain-service/types';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { updateAssetSetting } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Button } from '@subwallet/react-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function useAssetChecker () {
  const { t } = useTranslation();
  const { chainInfoMap, chainStateMap } = useSelector((root: RootState) => root.chainStore);
  const { assetRegistry, assetSettingMap } = useSelector((root: RootState) => root.assetRegistry);
  const notify = useNotification();
  const [enablingAsset, setEnablingAsset] = useState<string | null>(null);

  useEffect(() => {
    if (enablingAsset && assetSettingMap[enablingAsset]?.visible) {
      const assetInfo = assetRegistry[enablingAsset];
      const chainInfo = chainInfoMap[assetInfo.originChain];
      const message = t('{{name}} on {{chainName}} is turned on.', { replace: { name: assetInfo?.name, chainName: chainInfo?.name } });

      notify({ message, type: NotificationType.SUCCESS, duration: 1.5 });
      setEnablingAsset(null);
    }
  }, [enablingAsset, chainInfoMap, chainStateMap, notify, t, assetSettingMap, assetRegistry]);

  const ensureAssetEnable = useCallback((assetSlug: string) => {
    const assetSetting = assetSettingMap[assetSlug];
    const assetInfo = assetRegistry[assetSlug];
    const chainState = chainStateMap[assetInfo.originChain];
    const chainInfo = chainInfoMap[assetInfo.originChain];

    if (assetSetting) {
      if (!assetSetting.visible) {
        const message = t('{{name}} on {{chainName}} is not ready to use, do you want to turn it on?', { replace: { name: assetInfo?.name, chainName: chainInfo?.name } });

        const _onEnabled = () => {
          updateAssetSetting({ tokenSlug: assetSlug, assetSetting: { visible: true } }).then(() => {
            const chainInfo = chainInfoMap[assetSlug];

            setEnablingAsset(assetSlug);
            notify({ message: t('{{name}} on {{chainName}} is turning on.', { replace: { name: assetInfo?.name, chainName: chainInfo?.name } }), duration: 1.5 });
          }).catch(console.error);
        };

        const btn = <Button
          // eslint-disable-next-line react/jsx-no-bind
          onClick={_onEnabled}
          schema={'warning'}
          size={'md'}
        >
          {t('Turn it on')}
        </Button>;

        notify({
          message,
          type: NotificationType.WARNING,
          duration: 3,
          btn
        });
      } else if (chainState && chainState.connectionStatus === _ChainConnectionStatus.DISCONNECTED) {
        const message = t('Chain {{name}} is disconnected', { replace: { name: chainInfo?.name } });

        notify({
          message,
          type: NotificationType.ERROR,
          duration: 3
        });
      }
    }
  }, [assetRegistry, assetSettingMap, chainInfoMap, chainStateMap, notify, t]);

  return ensureAssetEnable;
}
