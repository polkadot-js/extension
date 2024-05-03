// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useSelectModalInputHelper } from '@subwallet/extension-koni-ui/hooks/form/useSelectModalInputHelper';
import { ThemeProps, TokenTypeItem } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Icon, InputRef, SelectModal, SettingItem } from '@subwallet/react-ui';
import { CheckCircle, Coin } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback } from 'react';
import styled from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';

interface Props extends ThemeProps, BasicInputWrapper {
  items: TokenTypeItem[];
}

const renderEmpty = () => <GeneralEmptyList />;

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { className = '', disabled, id = 'address-input', items, label, placeholder, statusHelp, title, tooltip, value } = props;
  const { t } = useTranslation();
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const renderChainSelected = useCallback((item: TokenTypeItem) => {
    return (
      <div className={'__selected-item'}>{item.label}</div>
    );
  }, []);

  const renderItem = useCallback((item: TokenTypeItem, selected: boolean) => {
    return (
      <SettingItem
        className='nft-type-item'
        leftItemIcon={(
          <BackgroundIcon
            backgroundColor='var(--token-type-icon-bg-color)'
            iconColor='var(--token-type-icon-color)'
            phosphorIcon={Coin}
            size='sm'
            weight='fill'
          />
        )}
        name={item.label}
        rightItem={
          selected &&
          (
            <Icon
              iconColor='var(--token-selected-icon-color)'
              phosphorIcon={CheckCircle}
              size='sm'
              weight='fill'
            />
          )
        }
      />
    );
  }, []);

  return (
    <SelectModal
      className={`${className} token-type-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} token-type-selector-input`}
      itemKey={'value'}
      items={items}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t('Select token type')}
      renderItem={renderItem}
      renderSelected={renderChainSelected}
      renderWhenEmpty={renderEmpty}
      selected={value || ''}
      statusHelp={statusHelp}
      title={title || label || placeholder || t('Select token type')}
      tooltip={tooltip}
    />
  );
}

export const TokenTypeSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '--token-type-icon-bg-color': token['orange-6'],
    '--token-type-icon-color': token.colorWhite,
    '--token-selected-icon-color': token.colorSuccess,

    '&.token-type-selector-input .__selected-item': {
      color: token.colorText
    },

    '.ant-web3-block-right-item': {
      marginRight: 0
    },

    '.ant-sw-list-section .ant-sw-list-wrapper': {
      flex: '1 1 auto'
    }
  });
});
