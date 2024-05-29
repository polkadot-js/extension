// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IMPORT_ACCOUNT_MODAL, IMPORT_SEED_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useClickOutSide, useGoBackSelectAccount, useIsPopup, useSetSessionLatest, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { renderModalSelector } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileJs, Leaf, QrCode, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { BackIcon, CloseIcon } from '../../Icon';
import { SettingItemSelection } from '../../Setting';

type Props = ThemeProps;

interface ImportAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
}

const modalId = IMPORT_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { setStateSelectAccount } = useSetSessionLatest();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const isActive = checkActive(modalId);

  const isPopup = useIsPopup();
  const onBack = useGoBackSelectAccount(modalId);

  const onCancel = useCallback(() => {
    setStateSelectAccount(true);
    inactiveModal(modalId);
  }, [inactiveModal, setStateSelectAccount]);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  const onClickItem = useCallback((path: string) => {
    return () => {
      inactiveModal(modalId);
      setStateSelectAccount(true);
      navigate(path);
    };
  }, [inactiveModal, setStateSelectAccount, navigate]);

  const onClickJson = useCallback(() => {
    if (isPopup) {
      windowOpen({ allowedPath: '/accounts/restore-json' }).catch(console.error);
    } else {
      inactiveModal(modalId);
      navigate('/accounts/restore-json');
    }
  }, [inactiveModal, isPopup, navigate]);

  const onClickSeed = useCallback(() => {
    inactiveModal(modalId);
    activeModal(IMPORT_SEED_MODAL);
  }, [activeModal, inactiveModal]);

  const items = useMemo((): ImportAccountItem[] => [
    {
      backgroundColor: token['green-7'],
      icon: Leaf,
      key: 'import-seed-phrase',
      label: t('Import from seed phrase'),
      onClick: onClickSeed
    },
    {
      backgroundColor: token['orange-7'],
      icon: FileJs,
      key: 'restore-json',
      label: t('Import from Polkadot.{js}'),
      onClick: onClickJson
    },
    {
      backgroundColor: token['gray-3'],
      icon: Wallet,
      key: 'import-private-key',
      label: t('Import by MetaMask private key'),
      onClick: onClickItem('/accounts/import-private-key')
    },
    {
      backgroundColor: token['blue-7'],
      icon: QrCode,
      key: 'import-by-qr',
      label: t('Import by QR code'),
      onClick: onClickItem('/accounts/import-by-qr')
    }
  ], [token, t, onClickSeed, onClickJson, onClickItem]);

  const renderIcon = useCallback((item: ImportAccountItem) => {
    return (
      <BackgroundIcon
        backgroundColor={item.backgroundColor}
        iconColor={token.colorText}
        phosphorIcon={item.icon}
        size='sm'
        weight='fill'
      />
    );
  }, [token.colorText]);

  return (
    <SwModal
      className={CN(className)}
      closeIcon={(<BackIcon />)}
      id={modalId}
      maskClosable={false}
      onCancel={onBack}
      rightIconProps={{
        icon: <CloseIcon />,
        onClick: onCancel
      }}
      title={t<string>('Import account')}
    >
      <div className='items-container'>
        {items.map((item) => {
          return (
            <div
              key={item.key}
              onClick={item.onClick}
            >
              <SettingItemSelection
                label={item.label}
                leftItemIcon={renderIcon(item)}
              />
            </div>
          );
        })}
      </div>
    </SwModal>
  );
};

const ImportAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default ImportAccountModal;
