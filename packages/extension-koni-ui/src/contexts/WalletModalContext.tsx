// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AttachAccountModal, CreateAccountModal, DeriveAccountModal, ImportAccountModal, NewAccountModal, RequestCameraAccessModal, RequestCreatePasswordModal } from '@subwallet/extension-koni-ui/components';
import { CustomizeModal } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModal';
import Confirmations from '@subwallet/extension-koni-ui/Popup/Confirmations';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalContext, SwModal, useExcludeModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

import SeedPhraseModal from '../components/Modal/Account/SeedPhraseModal';
import { ThemeProps } from '../types';
import { ScreenContext } from './ScreenContext';

interface Props {
  children: React.ReactNode;
}

export const PREDEFINED_MODAL_NAMES = ['debugger', 'transaction', 'confirmations'];
type PredefinedModalName = typeof PREDEFINED_MODAL_NAMES[number];

export const usePredefinedModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openPModal = useCallback((name: PredefinedModalName | null) => {
    setSearchParams((prev) => {
      if (name) {
        prev.set('popup', name);
      } else {
        prev.delete('popup');
      }

      return prev;
    });
  }, [setSearchParams]);

  const isOpenPModal = useCallback(
    (popupName?: string) => {
      const currentPopup = searchParams.get('popup');

      if (popupName) {
        return currentPopup === popupName;
      } else {
        return !!currentPopup;
      }
    },
    [searchParams]
  );

  return { openPModal, isOpenPModal };
};

const ModalWrapper = styled.div<ThemeProps & {
  isWebUI?: boolean
}>(
  ({ isWebUI }) => {
    const padding = isWebUI ? '0' : 'unset';

    return {
      height: '100%',

      '.ant-sw-modal-wrap': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        '.ant-sw-modal': {
          position: 'relative',
          padding: padding,
          '.ant-sw-modal-content': {
            borderRadius: 8,
            paddingBottom: 0
          }
        }
      }
    };
  }
);

export const WalletModalContext = ({ children }: Props) => {
  const { activeModal, hasActiveModal, inactiveAll, inactiveModals } = useContext(ModalContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountTypes, setAccountTypes] = useState<KeypairType[]>([]);
  const { hasConfirmations } = useSelector((state: RootState) => state.requestState);
  const { isWebUI } = useContext(ScreenContext);
  const { hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);

  useExcludeModal('confirmations');

  useEffect(() => {
    const confirmID = searchParams.get('popup');

    // Auto open confirm modal with method modalContext.activeModal else auto close all modal
    if (confirmID) {
      PREDEFINED_MODAL_NAMES.includes(confirmID) && activeModal(confirmID);
    } else {
      inactiveModals(PREDEFINED_MODAL_NAMES);
    }
  }, [activeModal, inactiveModals, searchParams]);

  const onCloseModal = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('popup');

      return prev;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (hasMasterPassword && isLocked) {
      inactiveAll();
    }
  }, [hasMasterPassword, inactiveAll, isLocked]);

  return <ModalWrapper isWebUI={isWebUI}>
    <div
      className={CN({
        'desktop-modal': isWebUI
      })}
      id='popup-container'
      style={{ zIndex: hasActiveModal ? undefined : -1 }}
    />
    {children}
    <SwModal
      className={isWebUI ? 'web-confirmation' : 'modal-full'}
      closable={false}
      id={'confirmations'}
      onCancel={onCloseModal}
      transitionName={'fade'}
      wrapClassName={CN({ 'd-none': !hasConfirmations })}
    >
      <Confirmations />
    </SwModal>
    <CreateAccountModal />
    <SeedPhraseModal accountTypes={accountTypes} />
    <ImportAccountModal />
    <AttachAccountModal />
    <NewAccountModal setAccountTypes={setAccountTypes} />
    <DeriveAccountModal />
    <RequestCreatePasswordModal />
    <RequestCameraAccessModal />
    <CustomizeModal />
  </ModalWrapper>;
};
