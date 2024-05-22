// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APP_POPUP_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useState } from 'react';

import AppPopupModal from '../components/Modal/Campaign/AppPopupModal';
import { AppContentButton } from '../types/staticContent';

interface AppPopupModalContextProviderProps {
  children?: React.ReactElement;
}

export type AppPopupModalInfo = {
  title?: string;
  message?: string;
  buttons?: AppContentButton[];
  externalButtons?: React.ReactElement;
  type?: 'popup' | 'banner' | 'confirmation';
  onPressBtn?: (url?: string) => void;
};

export interface AppPopupModalType {
  setAppPopupModal: React.Dispatch<React.SetStateAction<AppPopupModalInfo>>;
  hideAppPopupModal: () => void;
}

export const AppPopupModalContext = React.createContext({} as AppPopupModalType);

export const AppPopupModalContextProvider = ({ children }: AppPopupModalContextProviderProps) => {
  const [appPopupModal, setAppPopupModal] = useState<AppPopupModalInfo>({});
  const { inactiveModal } = useContext(ModalContext);

  const hideAppPopupModal = useCallback(() => {
    inactiveModal(APP_POPUP_MODAL);
    setTimeout(
      () =>
        setAppPopupModal((prevState) => ({
          ...prevState,
          title: '',
          message: '',
          buttons: [],
          externalButtons: <></>
        })),
      300
    );
  }, [inactiveModal]);

  return (
    <AppPopupModalContext.Provider value={{ setAppPopupModal, hideAppPopupModal }}>
      {children}
      <AppPopupModal
        buttons={appPopupModal.buttons || []}
        externalButtons={appPopupModal.externalButtons}
        message={appPopupModal.message || ''}
        onCloseModal={hideAppPopupModal}
        onPressButton={appPopupModal.onPressBtn}
        title={appPopupModal.title || ''}
      />
    </AppPopupModalContext.Provider>
  );
};
