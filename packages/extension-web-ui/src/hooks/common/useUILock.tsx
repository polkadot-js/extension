// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { keyringLock } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { updateUIViewState } from '@subwallet/extension-web-ui/stores/base/UIViewState';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export interface UILockInterface {
  isUILocked: boolean;
  lock: () => Promise<void>;
  unlock: () => void;
}

export default function useUILock (): UILockInterface {
  const navigate = useNavigate();
  const isUILocked = useSelector((state: RootState) => state.uiViewState.isUILocked);
  const dispatch = useDispatch();

  const lock = useCallback(async () => {
    dispatch(updateUIViewState({ isUILocked: true }));
    await keyringLock();
    navigate('/keyring/login');
  }, [dispatch, navigate]);

  const unlock = useCallback(() => {
    dispatch(updateUIViewState({ isUILocked: false }));
  }, [dispatch]);

  return { isUILocked, lock, unlock };
}
