// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { ModalContext, SwModalFuncProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { useCallback, useContext, useEffect } from 'react';

const CONFIRMATION_MODAL_ID = Date.now().toString();

export default function useConfirmModal (props: Partial<SwModalFuncProps>) {
  const { addConfirmModal, inactiveModal } = useContext(ModalContext);
  const confirmationModalId = props.id || CONFIRMATION_MODAL_ID;
  const { isWebUI } = useContext(ScreenContext);

  const handleSimpleConfirmModal = useCallback(() => new Promise<void>((resolve, reject) => {
    addConfirmModal({
      ...props,
      id: confirmationModalId,
      width: props.width || !isWebUI ? '100%' : undefined,
      className: CN('general-modal', {
        '-mobile': !isWebUI
      }),
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
  }), [addConfirmModal, confirmationModalId, inactiveModal, isWebUI, props]);

  useEffect(() => {
    return () => {
      inactiveModal(confirmationModalId);
    };
  }, [confirmationModalId, inactiveModal]);

  return { handleSimpleConfirmModal };
}
