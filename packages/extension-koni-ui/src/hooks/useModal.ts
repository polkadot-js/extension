// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { SwModalFuncProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import { useCallback, useContext } from 'react';

export default function useModal (props: SwModalFuncProps) {
  const { addConfirmModal, inactiveModal } = useContext(ModalContext);

  const handleOpenWarningModal = useCallback(() => {
    addConfirmModal({
      ...props,
      onCancel: () => {
        inactiveModal(props.id);
      },
      onOk: () => {
        inactiveModal(props.id);
      }
    });
  }, [addConfirmModal, inactiveModal, props]);

  return { handleOpenWarningModal };
}
