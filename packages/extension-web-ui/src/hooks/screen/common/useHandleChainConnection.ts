// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { useAlert, useChainConnection, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useEffect, useState } from 'react';

type ModalIds = {
  connectChainModalId: string,
  chainConnectionLoadingModalId: string,
  alertModalId: string,
}

export default function useHandleChainConnection (
  { alertModalId,
    chainConnectionLoadingModalId,
    connectChainModalId }: ModalIds,
  onConnectSuccess?: VoidFunction,
  timeoutDuration = 9000
) {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { checkChainConnected, turnOnChain } = useChainConnection();
  const [connectingChain, setConnectingChain] = useState<string| undefined>();
  const [isLoadingChainConnection, setIsLoadingChainConnection] = useState<boolean>(false);
  const [isConnectingChainSuccess, setIsConnectingChainSuccess] = useState<boolean>(false);
  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);
  const [extraSuccessFlag, setExtraSuccessFlag] = useState(true);

  const openConnectChainModal = useCallback((chain: string) => {
    setConnectingChain(chain);
    activeModal(connectChainModalId);
  }, [activeModal, connectChainModalId]);

  const closeConnectChainModal = useCallback(() => {
    inactiveModal(connectChainModalId);
  }, [connectChainModalId, inactiveModal]);

  const openLoadingModal = useCallback(() => {
    activeModal(chainConnectionLoadingModalId);
  }, [activeModal, chainConnectionLoadingModalId]);

  const closeLoadingModal = useCallback(() => {
    inactiveModal(chainConnectionLoadingModalId);
  }, [chainConnectionLoadingModalId, inactiveModal]);

  const onConnectChain = useCallback((chain: string) => {
    setConnectingChain(chain);
    turnOnChain(chain);
    setIsLoadingChainConnection(true);
    closeConnectChainModal();
    openLoadingModal();
  }, [closeConnectChainModal, openLoadingModal, turnOnChain]);

  useEffect(() => {
    let timer: NodeJS.Timer;
    let timeout: NodeJS.Timeout;

    if (isLoadingChainConnection && connectingChain) {
      const checkConnection = () => {
        if (checkChainConnected(connectingChain) && extraSuccessFlag) {
          setIsConnectingChainSuccess(true);
          closeLoadingModal();
          setIsLoadingChainConnection(false);
          clearInterval(timer);
          clearTimeout(timeout);
          onConnectSuccess?.();
        }
      };

      // Check network connection every 0.5 second
      timer = setInterval(checkConnection, 500);

      // Set timeout for 3 seconds
      timeout = setTimeout(() => {
        clearInterval(timer);

        if (!isConnectingChainSuccess) {
          closeLoadingModal();
          setIsLoadingChainConnection(false);
          openAlert({
            title: t('Error!'),
            type: NotificationType.ERROR,
            content: t('Failed to get data. Please try again later.'),
            okButton: {
              text: t('Continue'),
              onClick: closeAlert
            }
          });
        }
      }, timeoutDuration);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [checkChainConnected, closeAlert, closeLoadingModal, connectingChain, extraSuccessFlag, isConnectingChainSuccess, isLoadingChainConnection, onConnectSuccess, openAlert, t, timeoutDuration]);

  return {
    alertProps,
    closeAlert,
    openAlert,
    checkChainConnected,
    openConnectChainModal,
    closeConnectChainModal,
    connectingChain,
    onConnectChain,
    turnOnChain,
    setExtraSuccessFlag
  };
}
