// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ModalContext, SwModalFuncProps } from '@subwallet/react-ui';
import { useCallback, useContext, useEffect } from 'react';

const CONFIRMATION_MODAL_ID = Date.now().toString();

export default function useConfirmModal (props: Partial<SwModalFuncProps>) {
  const { addConfirmModal, inactiveModal } = useContext(ModalContext);
  const confirmationModalId = props.id || CONFIRMATION_MODAL_ID;

  const handleSimpleConfirmModal = useCallback((_props?: Partial<SwModalFuncProps>) => new Promise<void>((resolve, reject) => {
    addConfirmModal({
      ...props,
      ..._props,
      id: confirmationModalId,
      onCancel: () => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject();
        inactiveModal(confirmationModalId);
      },
      onOk: () => {
        resolve();
        inactiveModal(confirmationModalId);
      }
    });
  }), [addConfirmModal, confirmationModalId, inactiveModal, props]);

  useEffect(() => {
    return () => {
      inactiveModal(confirmationModalId);
    };
  }, [confirmationModalId, inactiveModal]);

  return { handleSimpleConfirmModal };
}
