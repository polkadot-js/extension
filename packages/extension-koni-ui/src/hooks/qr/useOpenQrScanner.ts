// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { REQUEST_CAMERA_ACCESS_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext } from 'react';

import settings from '@polkadot/ui-settings';

const useOpenQrScanner = (modalId: string) => {
  const { activeModal } = useContext(ModalContext);

  return useCallback(() => {
    if (settings.camera === 'on') {
      activeModal(modalId);
    } else {
      activeModal(REQUEST_CAMERA_ACCESS_MODAL);
    }
  }, [activeModal, modalId]);
};

export default useOpenQrScanner;
