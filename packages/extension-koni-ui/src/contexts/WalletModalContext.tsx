// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletUnlockType } from '@subwallet/extension-base/background/KoniTypes';
import { AttachAccountModal, ClaimDappStakingRewardsModal, CreateAccountModal, DeriveAccountModal, ImportAccountModal, ImportSeedModal, NewSeedModal, RemindBackupSeedPhraseModal, RequestCameraAccessModal, RequestCreatePasswordModal } from '@subwallet/extension-koni-ui/components';
import { CustomizeModal } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModal';
import { EARNING_INSTRUCTION_MODAL, LATEST_SESSION, REMIND_BACKUP_SEED_PHRASE_MODAL } from '@subwallet/extension-koni-ui/constants';
import Confirmations from '@subwallet/extension-koni-ui/Popup/Confirmations';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalContext, SwModal, useExcludeModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import { UnlockModal } from '../components/Modal/UnlockModal';

interface Props {
  children: React.ReactNode;
}

const SessionDays = 90 * 1000;

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

export const WalletModalContext = ({ children }: Props) => {
  const { activeModal, hasActiveModal, inactiveAll, inactiveModals } = useContext(ModalContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasConfirmations } = useSelector((state: RootState) => state.requestState);
  const { hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);
  const { unlockType } = useSelector((state: RootState) => state.settings);
  const [, setSessionLatest] = useLocalStorage(LATEST_SESSION, Date.now());
  const [isShowedRemindModal, setIsShowedRemind] = useState(false);

  useExcludeModal('confirmations');
  useExcludeModal(EARNING_INSTRUCTION_MODAL);

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

  useEffect(() => {
    const confirmID = searchParams.get('popup');

    // Auto open confirm modal with method modalContext.activeModal else auto close all modal
    if (confirmID) {
      PREDEFINED_MODAL_NAMES.includes(confirmID) && activeModal(confirmID);
    } else {
      inactiveModals(PREDEFINED_MODAL_NAMES);
    }
  }, [activeModal, inactiveModals, searchParams]);

  useEffect(() => {
    const infoSession = Date.now();

    const latestSession = (JSON.parse(localStorage.getItem(LATEST_SESSION) || '0') || infoSession) as number;

    if (unlockType === WalletUnlockType.WHEN_NEEDED || (unlockType === WalletUnlockType.ALWAYS_REQUIRED && !isLocked)) {
      if (infoSession - latestSession >= SessionDays && !isShowedRemindModal) {
        activeModal(REMIND_BACKUP_SEED_PHRASE_MODAL);
        setIsShowedRemind(true);
      }

      setSessionLatest(infoSession);
    }
  }, [activeModal, isLocked, isShowedRemindModal, setSessionLatest, unlockType]);

  // todo: will remove ClaimDappStakingRewardsModal after Astar upgrade to v3

  return <>
    <div
      id='popup-container'
      style={{ zIndex: hasActiveModal ? undefined : -1 }}
    />
    {children}
    <SwModal
      className={'modal-full'}
      closable={false}
      destroyOnClose={true}
      id={'confirmations'}
      onCancel={onCloseModal}
      transitionName={'fade'}
      wrapClassName={CN({ 'd-none': !hasConfirmations })}
    >
      <Confirmations />
    </SwModal>
    <CreateAccountModal />
    <RemindBackupSeedPhraseModal />
    <ImportAccountModal />
    <AttachAccountModal />
    <NewSeedModal />
    <ImportSeedModal />
    <DeriveAccountModal />
    <ClaimDappStakingRewardsModal />
    <RequestCreatePasswordModal />
    <RequestCameraAccessModal />
    <CustomizeModal />
    <UnlockModal />
  </>;
};
