// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenBalanceSelectionItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenBalanceSelectionItem';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { AccountBalanceHookType, TokenGroupHookType } from '@subwallet/extension-koni-ui/types/hook';
import { TokenDetailParam } from '@subwallet/extension-koni-ui/types/navigation';
import { SwList, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  id: string,
  onCancel: () => void,
  tokenBalanceMap: AccountBalanceHookType['tokenBalanceMap'],
  sortedTokenSlugs: TokenGroupHookType['sortedTokenSlugs'],
}

function getTokenBalances (
  tokenBalanceMap: AccountBalanceHookType['tokenBalanceMap'],
  sortedTokenSlugs: TokenGroupHookType['sortedTokenSlugs']): TokenBalanceItemType[] {
  const result: TokenBalanceItemType[] = [];

  sortedTokenSlugs.forEach((tokenSlug) => {
    if (tokenBalanceMap[tokenSlug]) {
      result.push(tokenBalanceMap[tokenSlug]);
    }
  });

  return result;
}

function Component ({ className = '', id, onCancel, sortedTokenSlugs, tokenBalanceMap }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const tokenBalances = useMemo<TokenBalanceItemType[]>(() => {
    return getTokenBalances(tokenBalanceMap, sortedTokenSlugs);
  }, [tokenBalanceMap, sortedTokenSlugs]);

  const onClickItem = useCallback((item: TokenBalanceItemType) => {
    return () => {
      navigate('/home/token-detail-list', { state: {
        symbol: item.symbol,
        tokenSlug: item.slug
      } as TokenDetailParam });
      onCancel();
    };
  }, [navigate, onCancel]);

  // todo: auto clear search when closing modal, may need update reactUI swList component

  const renderItem = useCallback(
    (tokenBalance: TokenBalanceItemType) => {
      return (
        <TokenBalanceSelectionItem
          key={tokenBalance.slug}
          {...tokenBalance}
          onPressItem={onClickItem(tokenBalance)}
        />
      );
    },
    [onClickItem]
  );

  const searchFunc = useCallback((item: TokenBalanceItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <SwModal
      className={className}
      id={id}
      onCancel={onCancel}
      title={'Select token'} // todo: i18n this
    >
      <SwList.Section
        displayRow
        enableSearchInput
        list={tokenBalances}
        renderItem={renderItem}
        rowGap = {'8px'}
        searchFunction={searchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder='Token name' // todo: i18n this
      />
    </SwModal>
  );
}

export const GlobalSearchTokenModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      padding: 0,
      display: 'flex',
      minHeight: '50vh'
    },

    '.ant-sw-list-section': {
      maxHeight: 'inherit',
      flex: 1
    },

    '.ant-sw-list-search-input': {
      marginBottom: token.marginXS
    },

    '.ant-sw-list': {
      paddingRight: token.padding
    }
  });
});
