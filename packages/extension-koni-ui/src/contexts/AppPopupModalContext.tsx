// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APP_POPUP_MODAL, SHOW_APP_POPUP } from '@subwallet/extension-koni-ui/constants';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import AppPopupModal from '../components/Modal/Campaign/AppPopupModal';
import { AppContentButton, PopupFrequency } from '../types/staticContent';

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
  repeat?: PopupFrequency;
};

export interface AppPopupModalType {
  openAppPopupModal: (data: AppPopupModalInfo) => void;
  hideAppPopupModal: () => void;
  setData: (data: AppPopupModalInfo[]) => void;
}

export const AppPopupModalContext = React.createContext({} as AppPopupModalType);

export const AppPopupModalContextProvider = ({ children }: AppPopupModalContextProviderProps) => {
  const [data, setData] = useState<AppPopupModalInfo[] | undefined>(undefined);
  const [appPopupModal, setAppPopupModal] = useState<AppPopupModalInfo>({});
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [showPopup, setShowPopup] = useLocalStorage<boolean>(SHOW_APP_POPUP, true);

  const openAppPopupModal = useCallback((data: AppPopupModalInfo) => {
    if (data.repeat && data.repeat === 'every_time') {
      if (showPopup) {
        setAppPopupModal(data);
        activeModal(APP_POPUP_MODAL);
      }
    } else {
      setAppPopupModal(data);
      activeModal(APP_POPUP_MODAL);
    }
  }, [activeModal, showPopup]);

  useEffect(() => {
    if (data && data.length) {
      openAppPopupModal(data[0]);
    }
  }, [data, openAppPopupModal]);

  const hideAppPopupModal = useCallback(() => {
    setShowPopup(false);
    inactiveModal(APP_POPUP_MODAL);
    setAppPopupModal((prevState) => ({
      ...prevState,
      title: '',
      message: '',
      buttons: [],
      externalButtons: <></>
    }));
  }, [inactiveModal, setShowPopup]);

  return (
    <AppPopupModalContext.Provider value={{ openAppPopupModal, hideAppPopupModal, setData }}>
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
