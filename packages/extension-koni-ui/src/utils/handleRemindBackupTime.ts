// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function handleRemindBackupTime () {
  // Handle
  const keyLatestSession = 'general.latest-session';
  const timeBackup = 1209600000;
  const DEFAULT_LATEST_SESSION = { remind: false, timeCalculate: Date.now(), timeBackup, isFinished: false };

  window.onbeforeunload = () => {
    const latestSessionRaw = localStorage.getItem(keyLatestSession);

    const latestSession = latestSessionRaw
      ? JSON.parse(latestSessionRaw) as {
        remind: boolean,
        timeCalculate: number
      }
      : DEFAULT_LATEST_SESSION;

    localStorage.setItem(keyLatestSession, JSON.stringify({ ...latestSession, remind: true }));
  };
}
