// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';
import { ATTACH_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { GlobalToken, Theme } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { DeviceTabletCamera, Eye, QrCode, Swatches } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

interface AttachAccountItem {
  label: string;
  modalId: string;
  icon: PhosphorIcon;
  backgroundColor: string;
}

const renderItems = (token: GlobalToken): AttachAccountItem[] => {
  return [
    {
      backgroundColor: token['orange-7'],
      icon: Swatches,
      modalId: '1',
      label: 'Connect Ledger device'
    },
    {
      backgroundColor: token['magenta-7'],
      icon: QrCode,
      modalId: '2',
      label: 'Connect Parity signer account'
    },
    {
      backgroundColor: token['blue-7'],
      icon: DeviceTabletCamera,
      modalId: '3',
      label: 'Connect Keystone device'
    },
    {
      backgroundColor: token['green-7'],
      icon: Eye,
      modalId: '3',
      label: 'Attach watch-only account'
    }
  ];
};

const modalId = ATTACH_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const items = useMemo((): AttachAccountItem[] => renderItems(token), [token]);
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

  const onClickItem = useCallback((item: AttachAccountItem): (() => void) => {
    return () => {
      inactiveModal(modalId);
      activeModal(item.modalId);
    };
  }, [activeModal, inactiveModal]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={onCancel}
      title={t<string>('Attach account')}
    >
      <div className='items-container'>
        {items.map((item) => {
          return (
            <div
              key={item.modalId}
              onClick={onClickItem(item)}
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
