// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CONFIRMATION_DETAIL_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext } from 'react';

const useOpenDetailModal = () => {
  const { activeModal } = useContext(ModalContext);

  return useCallback(() => {
    activeModal(CONFIRMATION_DETAIL_MODAL);
  }, [activeModal]);
};

export default useOpenDetailModal;
