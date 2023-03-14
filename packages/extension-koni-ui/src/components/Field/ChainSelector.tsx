// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ChainItemType } from '@subwallet/extension-koni-ui/types/network';
import { Icon, InputRef, Logo, NetworkItem, SelectModal } from '@subwallet/react-ui';
import { CheckCircle } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps, BasicInputWrapper {
  items: ChainItemType[]
}

function Component ({ className = '', disabled, id = 'address-input', items, label, onChange, placeholder, value }: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const renderChainSelected = useCallback((item: ChainItemType) => {
    return (
      <div className={'__selected-item'}>{item.name}</div>
    );
  }, []);

  const _onChange = useCallback(
    (value: string) => {
      onChange && onChange({ target: { value } });
    },
    [onChange]
  );

  const searchFunction = useCallback((item: ChainItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const chainLogo = useMemo(() => {
    return (
      <Logo
        network={value}
        size={token.controlHeightSM}
      />
    );
  }, [value, token.controlHeightSM]);

  const renderItem = useCallback((item: ChainItemType, selected: boolean) => {
    return (
      <NetworkItem
        name={item.name}
        networkKey={item.slug}
        networkMainLogoShape={'circle'}
        networkMainLogoSize={28}
        rightItem={selected && <Icon
          customSize={'20px'}
          iconColor={token.colorSuccess}
          phosphorIcon={CheckCircle}
          type='phosphor'
          weight={'fill'}
        />}
      />
    );
  }, [token]);

  return (
    <SelectModal
      className={`${className} chain-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} chain-selector-input`}
      itemKey={'slug'}
      items={items}
      label={label}
      onSelect={_onChange}
      placeholder={placeholder || t('Select chain')}
      prefix={value !== '' && chainLogo}
      renderItem={renderItem}
      renderSelected={renderChainSelected}
      searchFunction={searchFunction}
      searchPlaceholder={t('Search chain')}
      searchableMinCharactersCount={2}
      selected={value || ''}
    />
  );
}

export const ChainSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.chain-selector-input .__selected-item': {
      color: token.colorText
    }
  });
});
