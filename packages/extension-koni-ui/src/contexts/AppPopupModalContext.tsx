// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APP_POPUP_MODAL } from '@subwallet/extension-koni-ui/constants';
import { toggleCampaignPopup } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';

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
}

export const AppPopupModalContext = React.createContext({} as AppPopupModalType);

export const AppPopupModalContextProvider = ({ children }: AppPopupModalContextProviderProps) => {
  const [appPopupModal, setAppPopupModal] = useState<AppPopupModalInfo>({});
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isPopupVisible } = useSelector((state: RootState) => state.campaign);

  const openAppPopupModal = useCallback((data: AppPopupModalInfo) => {
    if (isPopupVisible) {
      setAppPopupModal(data);
      activeModal(APP_POPUP_MODAL);
    }
  }, [activeModal, isPopupVisible]);

  const hideAppPopupModal = useCallback(() => {
    toggleCampaignPopup({ value: false }).then(() => {
      inactiveModal(APP_POPUP_MODAL);
      setAppPopupModal((prevState) => ({
        ...prevState,
        title: '',
        message: '',
        buttons: [],
        externalButtons: <></>
      }));
    }).catch((e) => console.error(e));
  }, [inactiveModal]);

  return (
    <AppPopupModalContext.Provider value={{ openAppPopupModal, hideAppPopupModal }}>
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
