// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';
import { CREATE_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { GlobalToken, Theme } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ModalContext, SwModal } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import CN from 'classnames';
import { Info, Leaf, ShareNetwork } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

interface CreateAccountItem {
  label: string;
  modalId: string;
  icon: PhosphorIcon;
  backgroundColor: string;
}

const renderItems = (token: GlobalToken): CreateAccountItem[] => {
  return [
    {
      backgroundColor: token['green-7'],
      icon: Leaf,
      modalId: '1',
      label: 'Create with new Seed Phrase'
    },
    {
      backgroundColor: token['magenta-7'],
      icon: ShareNetwork,
      modalId: '2',
      label: 'Create with existing Seed Phrase'
    }
  ];
};

const modalId = CREATE_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const items = useMemo((): CreateAccountItem[] => renderItems(token), [token]);
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
  }, []);

  const onClickItem = useCallback((item: CreateAccountItem): (() => void) => {
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
              key={item.modalId}
              onClick={onClickItem(item)}
            >
              <SettingItemSelection
                className={'add-account-item-wrapper'}
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

const CreateNewAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default CreateNewAccountModal;
