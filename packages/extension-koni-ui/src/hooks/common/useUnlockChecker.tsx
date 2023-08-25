// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { UNLOCK_MODAL_ID } from '@subwallet/extension-koni-ui/components/Modal/UnlockModal';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

export default function useUnlockChecker (): () => Promise<void> {
  const isLocked = useSelector((state: RootState) => state.accountState.isLocked);
  const { activeModal, checkActive, data } = useContext(ModalContext);
  const unlockPromiseHandler = useRef(createPromiseHandler<void>());
  const isUnlocking = useRef(checkActive(UNLOCK_MODAL_ID));

  useEffect(() => {
    if (isLocked) {
      unlockPromiseHandler.current = createPromiseHandler();
    } else {
      unlockPromiseHandler.current.resolve();
    }
  }, [isLocked]);

  useEffect(() => {
    const unlockModalIsOpen = !!data.activeMap[UNLOCK_MODAL_ID];

    // On close modal
    if (isUnlocking.current && !unlockModalIsOpen) {
      if (isLocked) {
        unlockPromiseHandler.current.reject();
      } else {
        unlockPromiseHandler.current.resolve();
      }
    }

    isUnlocking.current = unlockModalIsOpen;
  }, [data.activeMap, isLocked]);

  return useCallback(() => {
    if (isLocked) {
      activeModal(UNLOCK_MODAL_ID);
      isUnlocking.current = true;

      return unlockPromiseHandler.current.promise;
    } else {
      return Promise.resolve();
    }
  }, [activeModal, isLocked]);
}
