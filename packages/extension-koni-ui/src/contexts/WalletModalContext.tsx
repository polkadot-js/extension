// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AttachAccountModal, ClaimDappStakingRewardsModal, CreateAccountModal, DeriveAccountModal, ImportAccountModal, ImportSeedModal, NewSeedModal, RemindBackupSeedPhraseModal, RequestCameraAccessModal, RequestCreatePasswordModal } from '@subwallet/extension-koni-ui/components';
import { CustomizeModal } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModal';
import { EARNING_INSTRUCTION_MODAL, LATEST_SESSION } from '@subwallet/extension-koni-ui/constants';
import { useGetConfig } from '@subwallet/extension-koni-ui/hooks';
import Confirmations from '@subwallet/extension-koni-ui/Popup/Confirmations';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { SessionStorage } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwModal, useExcludeModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import { UnlockModal } from '../components/Modal/UnlockModal';

interface Props {
  children: React.ReactNode;
}

const timeBackup = 1000 * 60 * 60 * 24 * 15;
const DEFAULT_SESSION_VALUE: SessionStorage = {
  remind: false,
  timeBackup,
  timeCalculate: Date.now(),
  finishStep: true
};

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
  const [, setSessionLatest] = useLocalStorage<SessionStorage>(LATEST_SESSION, DEFAULT_SESSION_VALUE);
  const { getConfig } = useGetConfig();
  const location = useLocation();

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

    const latestSession = (JSON.parse(localStorage.getItem(LATEST_SESSION) || JSON.stringify(DEFAULT_SESSION_VALUE))) as SessionStorage;

    getConfig()
      .then((timeBackup) => {
        if (infoSession - latestSession.timeCalculate >= timeBackup) {
          setSessionLatest({ ...latestSession, remind: true, finishStep: false });
        } else if (infoSession - latestSession.timeCalculate < timeBackup) {
          setSessionLatest({ timeBackup, timeCalculate: infoSession, remind: false, finishStep: true });
        } else if (location.pathname) {
          setSessionLatest(({ finishStep, remind, timeBackup, timeCalculate }) =>
            ({ timeBackup, remind, timeCalculate: remind ? timeCalculate : infoSession, finishStep }));
        }
      }).catch(console.error);
  }, [activeModal, getConfig, location.pathname, setSessionLatest]);

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
