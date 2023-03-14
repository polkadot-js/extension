// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, InputRef, Logo, SelectModal } from '@subwallet/react-ui';
import TokenItem from '@subwallet/react-ui/es/web3-block/token-item';
import { CheckCircle } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

export type TokenItemType = {
  name: string,
  slug: string,
  symbol: string,
  originChain: string,
};

interface Props extends ThemeProps, BasicInputWrapper {
  items: TokenItemType[],
  showChainInSelected?: boolean,
  prefixShape?: 'circle' | 'none' | 'squircle' | 'square';
}

function Component ({ className = '', disabled, id = 'token-select', items, label, onChange, placeholder, prefixShape, showChainInSelected = false, value }: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const renderTokenSelected = useCallback((item: TokenItemType) => {
    return (
      <div className={'__selected-item'}>
        {item.symbol}
        {showChainInSelected}
      </div>
    );
  }, [showChainInSelected]);

  const _onChange = useCallback(
    (value: string) => {
      onChange && onChange({ target: { value } });
    },
    [onChange]
  );

  const searchFunction = useCallback((item: TokenItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const chainLogo = useMemo(() => {
    const tokenInfo = items.find((x) => x.slug === value);

    return tokenInfo && <Logo
      isShowSubLogo={true}
      shape={'square'}
      size={token.controlHeightSM}
      subNetwork={tokenInfo.originChain}
      token={tokenInfo.symbol.toLowerCase()}
    />;
  }, [items, token.controlHeightSM, value]);

  const renderItem = useCallback((item: TokenItemType, selected: boolean) => {
    return (
      <TokenItem
        className={'token-item'}
        isShowSubLogo={true}
        name={item.symbol}
        networkMainLogoShape={'circle'}
        networkMainLogoSize={28}
        rightItem={selected && <Icon
          customSize={'20px'}
          iconColor={token.colorSuccess}
          phosphorIcon={CheckCircle}
          type='phosphor'
          weight={'fill'}
        />}
        subName={''}
        subNetworkKey={item.originChain}
        symbol={item.symbol.toLowerCase()}
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
      placeholder={placeholder || t('Select token')}
      prefix={value !== '' && chainLogo}
      renderItem={renderItem}
      renderSelected={renderTokenSelected}
      searchFunction={searchFunction}
      searchPlaceholder={t('Search chain')}
      searchableMinCharactersCount={2}
      selected={value || ''}
      title={label}
    />
  );
}

export const TokenSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.chain-selector-input .__selected-item': {
      color: token.colorText
    },

    // TODO: delete this when fix component in ui-base
    '.token-item .ant-network-item-sub-name': {
      display: 'none'
    }
  });
});
