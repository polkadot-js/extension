// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LATEST_SESSION } from '@subwallet/extension-koni-ui/constants/localStorage';

export function handleRemindBackupTime () {
  // Handle
  const timeBackup = 1209600000;
  const DEFAULT_LATEST_SESSION = { remind: false, timeCalculate: Date.now(), timeBackup, isFinished: false };

  window.onbeforeunload = () => {
    const latestSessionRaw = localStorage.getItem(LATEST_SESSION);

    const latestSession = latestSessionRaw
      ? JSON.parse(latestSessionRaw) as {
        remind: boolean,
        timeCalculate: number
      }
      : DEFAULT_LATEST_SESSION;

    localStorage.setItem(LATEST_SESSION, JSON.stringify({ ...latestSession, remind: true }));
  };
}
