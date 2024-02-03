// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertDialogProps } from '@subwallet/extension-web-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useState } from 'react';

const useAlert = (alertModalId: string, initAlertProps?: AlertDialogProps) => {
  const [alertProps, setAlertProps] = useState<AlertDialogProps | undefined>(initAlertProps);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const openAlert = useCallback((alertProps: AlertDialogProps) => {
    setAlertProps(alertProps);
    activeModal(alertModalId);
  }, [activeModal, alertModalId]);

  const closeAlert = useCallback(() => {
    inactiveModal(alertModalId);
    setAlertProps(undefined);
  }, [alertModalId, inactiveModal]);

  return {
    alertProps,
    setAlertProps,
    openAlert,
    closeAlert
  };
};

export default useAlert;
