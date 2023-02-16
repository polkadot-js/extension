// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';
import { CREATE_ACCOUNT_MODAL, NEW_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { Info, Leaf, ShareNetwork } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

interface CreateAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
}

const modalId = CREATE_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const renderIcon = useCallback((item: CreateAccountItem) => {
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

  const items = useMemo((): CreateAccountItem[] => ([
    {
      backgroundColor: token['green-7'],
      icon: Leaf,
      key: 'new-seed-phrase',
      label: 'Create with new Seed Phrase',
      onClick: () => {
        inactiveModal(modalId);
        activeModal(NEW_ACCOUNT_MODAL);
      }
    },
    {
      backgroundColor: token['magenta-7'],
      icon: ShareNetwork,
      key: 'derive-account',
      label: 'Create with existing Seed Phrase',
      onClick: () => { /* Empty */ }
    }
  ]), [activeModal, inactiveModal, token]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={onCancel}
      rightIconProps={{
        icon: (
          <Icon
            phosphorIcon={Info}
            size='sm'
          />
        )
      }}
      title={t<string>('Create new account')}
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

const CreateAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default CreateAccountModal;
