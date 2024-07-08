// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { UPGRADE_FIREFOX_VERSION } from '@subwallet/extension-koni-ui/constants';
import { getVersionBrowser } from '@subwallet/extension-koni-ui/utils';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export interface SetStateUpgradeFireFoxVersion {
  isUpdatedVersion: boolean;
  setIsUpdatedVersion: Dispatch<SetStateAction<boolean>>;
  isNeedUpgradeVersion: () => Promise<boolean>
}

const versionToCheck = 127;

const useUpgradeFireFoxVersion = (): SetStateUpgradeFireFoxVersion => {
  const [isUpdatedVersion, setIsUpdatedVersion] = useLocalStorage(UPGRADE_FIREFOX_VERSION, false);
  const browser_ = useMemo(() => chrome || browser, []);

  const checkPermissionAccessEnable = useCallback(async () => {
    try {
      const [state_, permissions_] = await Promise.all([
        browser_.permissions.contains({ permissions: ['activeTab'] }),
        browser_.permissions.getAll()
      ]);

      return state_ && !!permissions_.origins && permissions_.origins.length > 0;
    } catch (e) {
      console.error(e);

      return false;
    }
  }, [browser_]);

  const isNeedUpgradeVersion = useCallback(async () => {
    const [browser, version] = getVersionBrowser();

    if (browser.toLowerCase() === 'firefox') {
      const versionNumber = Number.parseInt(version.split('.')[0]);
      const isEnablePermission = await checkPermissionAccessEnable();
      const isUpdatedVersion = localStorage.getItem(UPGRADE_FIREFOX_VERSION) || false;

      return versionNumber < versionToCheck && !isEnablePermission && !isUpdatedVersion;
    }

    return false;
  }, [checkPermissionAccessEnable]);

  return {
    isUpdatedVersion,
    setIsUpdatedVersion,
    isNeedUpgradeVersion
  };
};

export default useUpgradeFireFoxVersion;
