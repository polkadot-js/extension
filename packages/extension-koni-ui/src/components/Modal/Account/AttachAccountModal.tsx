// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BackIcon from '@subwallet/extension-koni-ui/components/Icon/BackIcon';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';
import { ATTACH_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { useSetSessionLatest } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useClickOutSide from '@subwallet/extension-koni-ui/hooks/dom/useClickOutSide';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/dom/useIsPopup';
import useGoBackSelectAccount from '@subwallet/extension-koni-ui/hooks/modal/useGoBackSelectAccount';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { renderModalSelector } from '@subwallet/extension-koni-ui/utils/common/dom';
import { BackgroundIcon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { DeviceTabletCamera, Eye, QrCode, Swatches } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

interface AttachAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
}

const modalId = ATTACH_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { checkActive, inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const isPopup = useIsPopup();
  const { setStateSelectAccount } = useSetSessionLatest();

  const isActive = checkActive(modalId);

  const onBack = useGoBackSelectAccount(modalId);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
    setStateSelectAccount(true);
  }, [inactiveModal, setStateSelectAccount]);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  const renderIcon = useCallback((item: AttachAccountItem) => {
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

  const onClickItem = useCallback((path: string) => {
    return () => {
      setStateSelectAccount(true);
      inactiveModal(modalId);
      navigate(path);
    };
  }, [setStateSelectAccount, inactiveModal, navigate]);

  const onClickLedger = useCallback(() => {
    inactiveModal(modalId);
    setStateSelectAccount(true);

    if (isPopup) {
      windowOpen({ allowedPath: '/accounts/connect-ledger' }).catch(console.error);
    } else {
      navigate('accounts/connect-ledger');
    }
  }, [inactiveModal, isPopup, navigate, setStateSelectAccount]);

  const items = useMemo((): AttachAccountItem[] => ([
    {
      backgroundColor: token['orange-7'],
      icon: Swatches,
      key: 'connect-ledger',
      label: t('Connect a Ledger device'),
      onClick: onClickLedger
    },
    {
      backgroundColor: token['magenta-7'],
      icon: QrCode,
      key: 'connect-polkadot-vault',
      label: t('Connect a Polkadot Vault account'),
      onClick: onClickItem('accounts/connect-polkadot-vault')
    },
    {
      backgroundColor: token['blue-7'],
      icon: DeviceTabletCamera,
      key: 'connect-keystone',
      label: t('Connect a Keystone device'),
      onClick: onClickItem('accounts/connect-keystone')
    },
    {
      backgroundColor: token['green-7'],
      icon: Eye,
      key: 'attach-read-only',
      label: t('Attach a watch-only account'),
      onClick: onClickItem('accounts/attach-read-only')
    }
  ]), [t, token, onClickItem, onClickLedger]);

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
      title={t<string>('Attach an account')}
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

const AttachAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default AttachAccountModal;
