// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { NEW_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Logo, ModalContext, SettingItem, SwModal } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

interface NewAccountItem {
  label: string;
  key: KeypairType;
  icon: string;
  onClick: () => void;
}

const modalId = NEW_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);

  const [selectedItems, setSelectedItems] = useState<KeypairType[]>([]);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onClickItem = useCallback((key: KeypairType): (() => void) => {
    return () => {
      setSelectedItems((prevState) => {
        const result = [...prevState];
        const exists = result.find((i) => i === key);

        if (exists) {
          return result.filter((i) => i !== key);
        } else {
          result.push(key);

          return result;
        }
      });
    };
  }, []);

  const items = useMemo((): NewAccountItem[] => ([
    {
      icon: 'polkadot',
      key: SUBSTRATE_ACCOUNT_TYPE,
      label: 'Substrate account',
      onClick: onClickItem(SUBSTRATE_ACCOUNT_TYPE)
    },
    {
      icon: 'ethereum',
      key: EVM_ACCOUNT_TYPE,
      label: 'Ethereum account',
      onClick: onClickItem(EVM_ACCOUNT_TYPE)
    }
  ]), [onClickItem]);

  const onSubmit = useCallback(() => {
    console.log(selectedItems);
  }, [selectedItems]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={onCancel}
      title={t<string>('Select account type')}
    >
      <div className='items-container'>
        {items.map((item) => {
          const _selected = selectedItems.find((i) => i === item.key);

          return (
            <div
              key={item.key}
              onClick={item.onClick}
            >
              <SettingItem
                className={CN('setting-item', { selected: _selected })}
                leftItemIcon={(
                  <Logo
                    shape='circle'
                    size={20}
                    token={item.icon}
                  />
                )}
                name={t<string>(item.label)}
                rightItem={(
                  <Icon
                    className={'__selected-icon'}
                    iconColor='var(--icon-color)'
                    phosphorIcon={CheckCircle}
                    size='sm'
                    weight='fill'
                  />
                )}
              />
            </div>
          );
        })}
        <Button
          block={true}
          icon={(
            <Icon
              className={'icon-submit'}
              customSize={'28px'}
              iconColor='var(--icon-color)'
              phosphorIcon={CheckCircle}
              size='sm'
              weight='fill'
            />
          )}
          onClick={onSubmit}
        >
          {t('Confirm')}
        </Button>
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
    },

    '.setting-item': {
      '--icon-color': token['gray-4'],

      '&.selected': {
        '--icon-color': token.colorSecondary
      }
    },

    '.icon-submit': {
      '--icon-color': token.colorTextBase
    },

    '.__selected-icon': {
      paddingRight: 8
    }
  };
});

export default CreateAccountModal;
