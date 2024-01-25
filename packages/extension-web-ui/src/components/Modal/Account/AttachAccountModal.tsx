// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BackIcon from '@subwallet/extension-web-ui/components/Icon/BackIcon';
import CloseIcon from '@subwallet/extension-web-ui/components/Icon/CloseIcon';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { SettingItemSelection } from '@subwallet/extension-web-ui/components/Setting/SettingItemSelection';
import { ATTACH_ACCOUNT_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useClickOutSide from '@subwallet/extension-web-ui/hooks/dom/useClickOutSide';
import useIsPopup from '@subwallet/extension-web-ui/hooks/dom/useIsPopup';
import useGoBackSelectAccount from '@subwallet/extension-web-ui/hooks/modal/useGoBackSelectAccount';
import usePreloadView from '@subwallet/extension-web-ui/hooks/router/usePreloadView';
import { windowOpen } from '@subwallet/extension-web-ui/messaging';
import { Theme } from '@subwallet/extension-web-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-web-ui/types';
import { renderModalSelector } from '@subwallet/extension-web-ui/utils/common/dom';
import { BackgroundIcon, ModalContext } from '@subwallet/react-ui';
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
  const { isWebUI } = useContext(ScreenContext);

  usePreloadView([
    'AttachReadOnly',
    'ConnectPolkadotVault',
    'ConnectKeystone',
    'ConnectLedger'
  ]);

  const isActive = checkActive(modalId);

  const onBack = useGoBackSelectAccount(modalId);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

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
      inactiveModal(modalId);
      navigate(path);
    };
  }, [navigate, inactiveModal]);

  const onClickLedger = useCallback(() => {
    inactiveModal(modalId);

    if (isPopup) {
      windowOpen({ allowedPath: '/accounts/connect-ledger' }).catch(console.error);
    } else {
      navigate('accounts/connect-ledger');
    }
  }, [inactiveModal, isPopup, navigate]);

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
    <BaseModal
      className={CN(className)}
      closeIcon={isWebUI ? undefined : (<BackIcon />)}
      id={modalId}
      maskClosable={false}
      onCancel={isWebUI ? onCancel : onBack}
      rightIconProps={isWebUI
        ? undefined
        : ({
          icon: <CloseIcon />,
          onClick: onCancel
        })}
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
    </BaseModal>
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
