// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_SESSION_VALUE, LATEST_SESSION } from '@subwallet/extension-koni-ui/constants';
import { SessionStorage } from '@subwallet/extension-koni-ui/types';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

export interface SetSessionLatestInterface {
  sessionLatest: SessionStorage;
  setSessionLatest: Dispatch<SetStateAction<SessionStorage>>;
  onHandleSessionLatest: (timeBackup?: number) => void;
  setTimeBackUp: (timeBackup: number) => void;
  setStateSelectAccount: (isFinished: boolean) => void;
}

const useSetSessionLatest = (): SetSessionLatestInterface => {
  const [sessionLatest, setSessionLatest] = useLocalStorage<SessionStorage>(LATEST_SESSION, DEFAULT_SESSION_VALUE);
  const location = useLocation();

  const onHandleSessionLatest = useCallback((timeBackup_?: number) => {
    const infoSession = Date.now();

    const latestSession = (JSON.parse(localStorage.getItem(LATEST_SESSION) || JSON.stringify(DEFAULT_SESSION_VALUE))) as SessionStorage;
    const timeBackup = timeBackup_ || latestSession.timeBackup;

    if (infoSession - latestSession.timeCalculate >= timeBackup) {
      setSessionLatest({ ...latestSession, remind: true, timeBackup, isFinished: false });
    } else if (infoSession - latestSession.timeCalculate < timeBackup) {
      setSessionLatest({ timeBackup, timeCalculate: infoSession, remind: false, isFinished: true });
    } else if (location.pathname) {
      setSessionLatest((session) =>
        ({ ...session, timeCalculate: session.remind ? session.timeCalculate : infoSession }));
    }
  }, [location.pathname, setSessionLatest]);

  const setStateSelectAccount = useCallback((isFinished: boolean) => {
    setSessionLatest((prevState) => ({ ...prevState, isFinished }));
  }, [setSessionLatest]);

  const setTimeBackUp = useCallback((timeBackup: number) => {
    setSessionLatest((prevState) => ({ ...prevState, timeBackup }));
  }, [setSessionLatest]);

  return {
    sessionLatest,
    onHandleSessionLatest,
    setSessionLatest,
    setStateSelectAccount,
    setTimeBackUp
  };
};

export default useSetSessionLatest;
