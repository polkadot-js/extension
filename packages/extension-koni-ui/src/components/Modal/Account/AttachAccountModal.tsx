// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BackIcon from '@subwallet/extension-koni-ui/components/Icon/BackIcon';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';
import { ATTACH_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useClickOutSide from '@subwallet/extension-koni-ui/hooks/dom/useClickOutSide';
import useGoBackSelectAccount from '@subwallet/extension-koni-ui/hooks/modal/useGoBackSelectAccount';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { renderModalSelector } from '@subwallet/extension-koni-ui/util/dom';
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
  const items = useMemo((): AttachAccountItem[] => ([
    {
      backgroundColor: token['orange-7'],
      icon: Swatches,
      key: 'connect-ledger',
      label: 'Connect Ledger device',
      onClick: onClickItem('accounts/connect-ledger')
    },
    {
      backgroundColor: token['magenta-7'],
      icon: QrCode,
      key: 'connect-parity-signer',
      label: 'Connect Parity signer account',
      onClick: onClickItem('accounts/connect-parity-signer')
    },
    {
      backgroundColor: token['blue-7'],
      icon: DeviceTabletCamera,
      key: 'connect-keystone',
      label: 'Connect Keystone device',
      onClick: onClickItem('accounts/connect-keystone')
    },
    {
      backgroundColor: token['green-7'],
      icon: Eye,
      key: 'attach-read-only',
      label: 'Attach watch-only account',
      onClick: onClickItem('accounts/attach-read-only')
    }
  ]), [token, onClickItem]);

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
      title={t<string>('Attach account')}
    >
      <div className='items-container'>
        {items.map((item) => {
          return (
            <div
              key={item.key}
              onClick={item.onClick}
            >
              <SettingItemSelection
                label={t<string>(item.label)}
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
