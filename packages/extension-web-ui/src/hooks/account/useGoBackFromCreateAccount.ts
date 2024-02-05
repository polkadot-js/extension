// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-web-ui/constants/router';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const useGoBackFromCreateAccount = (modalId: string) => {
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);

  return useCallback(() => {
    navigate(DEFAULT_ROUTER_PATH);
    activeModal(modalId);
  }, [navigate, modalId, activeModal]);
};

export default useGoBackFromCreateAccount;
