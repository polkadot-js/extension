// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext } from 'react';

const useSwitchModal = (currentModalId: string, targetModalId: string, callback?: () => void) => {
  const { activeModal, inactiveModal } = useContext(ModalContext);

  return useCallback(() => {
    inactiveModal(currentModalId);
    activeModal(targetModalId);
    callback && callback();
  }, [activeModal, currentModalId, inactiveModal, targetModalId, callback]);
};

export default useSwitchModal;
