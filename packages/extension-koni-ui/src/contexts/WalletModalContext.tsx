// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AttachAccountModal, CreateAccountModal, DeriveAccountModal, ImportAccountModal, ImportSeedModal, NewSeedModal, RequestCameraAccessModal, RequestCreatePasswordModal } from '@subwallet/extension-koni-ui/components';
import { ConfirmationModal } from '@subwallet/extension-koni-ui/components/Modal/ConfirmationModal';
import { CustomizeModal } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModal';
import { CREATE_ACCOUNT_MODAL, SEED_PHRASE_MODAL } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalContext, useExcludeModal } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { KeypairType } from '@polkadot/util-crypto/types';

import SeedPhraseModal from '../components/Modal/Account/SeedPhraseModal';
import { UnlockModal } from '../components/Modal/UnlockModal';
import useSwitchModal from '../hooks/modal/useSwitchModal';

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
    }, { replace: true });
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

export const WalletModalContext = ({ children }: Props) => {
  const navigate = useNavigate();
  const { activeModal, hasActiveModal, inactiveAll, inactiveModals } = useContext(ModalContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountTypes, setAccountTypes] = useState<KeypairType[]>([]);
  const { hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);

  useExcludeModal('confirmations');
  useExcludeModal('transfer-fund-modal');
  useExcludeModal('buy-token-modal');

  useEffect(() => {
    const confirmID = searchParams.get('popup');

    // Auto open confirm modal with method modalContext.activeModal else auto close all modal
    if (confirmID) {
      PREDEFINED_MODAL_NAMES.includes(confirmID) && activeModal(confirmID);
    } else {
      inactiveModals(PREDEFINED_MODAL_NAMES);
    }
  }, [activeModal, inactiveModals, searchParams]);

  const onCloseConfirmationModal = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('popup');

      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (hasMasterPassword && isLocked) {
      inactiveAll();
    }
  }, [hasMasterPassword, inactiveAll, isLocked]);

  const onSeedPhraseModalBack = useSwitchModal(SEED_PHRASE_MODAL, CREATE_ACCOUNT_MODAL);

  const onSeedPhraseModalSubmitSuccess = useCallback(() => {
    navigate(DEFAULT_ROUTER_PATH);
  }, [navigate]);

  return <>
    <div
      id='popup-container'
      style={{ zIndex: hasActiveModal ? undefined : -1 }}
    />
    {children}
    <ConfirmationModal
      id={'confirmations'}
      onCancel={onCloseConfirmationModal}
    />
    <CreateAccountModal />
    <SeedPhraseModal
      accountTypes={accountTypes}
      modalId={SEED_PHRASE_MODAL}
      onBack={onSeedPhraseModalBack}
      onSubmitSuccess={onSeedPhraseModalSubmitSuccess}
    />
    <NewSeedModal />
    <ImportAccountModal />
    <AttachAccountModal />
    <ImportSeedModal />
    <DeriveAccountModal />
    <RequestCreatePasswordModal />
    <RequestCameraAccessModal />
    <CustomizeModal />
    <UnlockModal />
  </>;
};
