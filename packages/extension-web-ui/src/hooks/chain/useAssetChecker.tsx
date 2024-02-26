// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainConnectionStatus } from '@subwallet/extension-base/services/chain-service/types';
import useNotification from '@subwallet/extension-web-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { enableChain, updateAssetSetting } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { Button } from '@subwallet/react-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

export default function useAssetChecker () {
  const { t } = useTranslation();
  const { chainInfoMap, chainStateMap, chainStatusMap } = useSelector((root: RootState) => root.chainStore);
  const { assetRegistry, assetSettingMap } = useSelector((root: RootState) => root.assetRegistry);
  const notify = useNotification();
  const [enablingAsset, setEnablingAsset] = useState<string | null>(null);
  const asset = useRef<string | null>(null);

  useEffect(() => {
    if (enablingAsset && assetSettingMap[enablingAsset]?.visible) {
      const assetInfo = assetRegistry[enablingAsset];
      const message = t('{{name}} is turned on.', { replace: { name: assetInfo?.symbol } });

      notify({ message, type: NotificationType.SUCCESS, duration: 1 });
      setEnablingAsset(null);
    }
  }, [enablingAsset, chainInfoMap, chainStateMap, notify, t, assetSettingMap, assetRegistry]);

  return useCallback((assetSlug: string) => {
    if (asset.current === assetSlug) {
      return;
    }

    asset.current = assetSlug;
    const assetSetting = assetSettingMap[assetSlug];
    const assetInfo = assetRegistry[assetSlug];
    const chainState = chainStateMap[assetInfo.originChain];
    const chainInfo = chainInfoMap[assetInfo.originChain];
    const chainStatus = chainStatusMap[assetInfo.originChain];

    if ((assetInfo && !assetSetting) || !assetSetting.visible) {
      const message = t('{{name}} on {{chainName}} is not ready to use, do you want to turn it on?', {
        replace: {
          name: assetInfo?.symbol,
          chainName: chainInfo?.name
        }
      });

      const _onEnabled = () => {
        updateAssetSetting({
          tokenSlug: assetSlug,
          assetSetting: { visible: true },
          autoEnableNativeToken: true
        }).then(() => {
          setEnablingAsset(assetSlug);
          notify({ message: t('{{name}} is turning on.', { replace: { name: assetInfo?.symbol } }), duration: 1.5 });
        }).catch(console.error);
      };

      const btn = <Button
        // eslint-disable-next-line react/jsx-no-bind
        onClick={_onEnabled}
        schema={'warning'}
        size={'xs'}
      >
        {t('Turn it on')}
      </Button>;

      notify({
        message,
        type: NotificationType.WARNING,
        duration: 3,
        btn
      });
    } else if (!!assetSetting?.visible && !chainState?.active) {
      enableChain(assetInfo.originChain, false).catch(console.error);
    } else if (chainStatus && chainStatus.connectionStatus === _ChainConnectionStatus.DISCONNECTED) {
      const message = t('Chain {{name}} is disconnected', { replace: { name: chainInfo?.name } });

      notify({
        message,
        type: NotificationType.ERROR,
        duration: 3
      });
    }
  }, [assetRegistry, assetSettingMap, chainInfoMap, chainStateMap, chainStatusMap, notify, t]);
}
