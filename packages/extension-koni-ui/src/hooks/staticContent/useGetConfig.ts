// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchStaticData } from '@subwallet/extension-base/utils';
import { DEFAULT_SESSION_VALUE, LATEST_SESSION } from '@subwallet/extension-koni-ui/constants';
import { SessionStorage } from '@subwallet/extension-koni-ui/types';
import { useCallback, useMemo } from 'react';

interface BackupTimeOutData {
  backupTimeout: number
}
const SlugDomain = 'config/remind-backup';

const useGetConfig = () => {
  const latestSession = useMemo(() =>
    (JSON.parse(localStorage.getItem(LATEST_SESSION) || JSON.stringify(DEFAULT_SESSION_VALUE))) as SessionStorage, []);

  const getConfig = useCallback(async () => {
    try {
      const res = await fetchStaticData(SlugDomain);

      return (res as BackupTimeOutData).backupTimeout;
    } catch {
      return latestSession.timeBackup;
    }
  }, [latestSession.timeBackup]);

  return { getConfig };
};

export default useGetConfig;
