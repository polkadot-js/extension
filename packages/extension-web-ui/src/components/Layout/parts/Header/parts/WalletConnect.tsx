// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletConnect as WalletConnectIcon } from '@subwallet/extension-web-ui/components';
import { WALLET_CONNECT_CREATE_MODAL, WALLET_CONNECT_DETAIL_MODAL, WALLET_CONNECT_LIST_MODAL } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import ConnectionDetailModal from '@subwallet/extension-web-ui/Popup/WalletConnect/ConnectionDetail';
import ConnectionListModal from '@subwallet/extension-web-ui/Popup/WalletConnect/ConnectionList';
import ConnectWalletConnectModal from '@subwallet/extension-web-ui/Popup/WalletConnect/ConnectWalletConnect';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { BackgroundIcon, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretLeft } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();

  const sessions = useSelector((state) => state.walletConnect.sessions);

  const sessionItems = useMemo(() => Object.values(sessions), [sessions]);

  const isEmptySession = !sessionItems.length;

  const [topic, setTopic] = useState<string | undefined>(undefined);

  const openListModal = useCallback(() => {
    activeModal(WALLET_CONNECT_LIST_MODAL);
  }, [activeModal]);

  const closeListModal = useCallback(() => {
    inactiveModal(WALLET_CONNECT_LIST_MODAL);
  }, [inactiveModal]);

  const openDetailModal = useCallback(() => {
    activeModal(WALLET_CONNECT_DETAIL_MODAL);
  }, [activeModal]);

  const closeDetailModal = useCallback(() => {
    inactiveModal(WALLET_CONNECT_DETAIL_MODAL);
  }, [inactiveModal]);

  const openConnectModal = useCallback(() => {
    activeModal(WALLET_CONNECT_CREATE_MODAL);
  }, [activeModal]);

  const closeConnectModal = useCallback(() => {
    inactiveModal(WALLET_CONNECT_CREATE_MODAL);
  }, [inactiveModal]);

  const triggerLabel = useMemo(() => {
    if (!sessionItems.length) {
      return '0 ' + t('connection');
    }

    if (sessionItems.length === 1) {
      return '01 ' + t('connection');
    }

    return `${sessionItems.length}`.padStart(2, '0') + ' ' + t('connections');
  }, [sessionItems.length, t]);

  const connectWalletConnectModalProps = useMemo(() => {
    return ({
      closeIcon: isEmptySession
        ? undefined
        : (
          <Icon
            customSize={'24px'}
            phosphorIcon={CaretLeft}
          />
        ),
      onCancel: closeConnectModal
    });
  }, [closeConnectModal, isEmptySession]);

  const onOpenDetail = useCallback((topic: string) => {
    setTopic(topic);
    openDetailModal();
  }, [openDetailModal]);

  return (
    <>
      <div
        className={CN('trigger-container', className)}
        onClick={isEmptySession ? openConnectModal : openListModal }
      >
        <BackgroundIcon
          backgroundColor={token['green-6']}
          customIcon={
            <WalletConnectIcon
              height='1em'
              width='1em'
            />
          }
          size='sm'
          type={'customIcon'}
          weight='fill'
        />
        <span className={'__trigger-label'}>
          {triggerLabel}
        </span>
      </div>

      <ConnectionListModal
        isModal
        modalProps={{
          onCancel: closeListModal
        }}
        onAdd={openConnectModal}
        onClickItem={onOpenDetail}
      />

      <ConnectionDetailModal
        isModal
        modalProps={{
          closeIcon: (
            <Icon
              customSize={'24px'}
              phosphorIcon={CaretLeft}
            />
          ),
          onCancel: closeDetailModal
        }}
        topic={topic}
      />

      <ConnectWalletConnectModal
        isModal
        modalProps={connectWalletConnectModalProps}
        onAfterConnect={closeConnectModal}
      />
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletConnect = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {

  };
});

export default WalletConnect;
