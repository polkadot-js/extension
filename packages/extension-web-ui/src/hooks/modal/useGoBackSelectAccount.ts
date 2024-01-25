// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SELECT_ACCOUNT_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import useSwitchModal from '@subwallet/extension-web-ui/hooks/modal/useSwitchModal';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const targetModalId = SELECT_ACCOUNT_MODAL;

const useGoBackSelectAccount = (currentModalId: string) => {
  const { pathname } = useLocation();
  const { inactiveModal } = useContext(ModalContext);
  const switchModal = useSwitchModal(currentModalId, targetModalId);
  const isAtWelcome = useMemo(() => pathname === '/welcome', [pathname]);

  return useCallback(() => {
    if (isAtWelcome) {
      inactiveModal(currentModalId);
    } else {
      switchModal();
    }
  }, [currentModalId, inactiveModal, isAtWelcome, switchModal]);
};

export default useGoBackSelectAccount;
