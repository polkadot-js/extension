// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal, TokenBalanceSelectionItem, TokenEmptyList } from '@subwallet/extension-koni-ui/components';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { useChainAssets } from '@subwallet/extension-koni-ui/hooks/assets';
import { AccountBalanceHookType, ThemeProps, TokenBalanceItemType, TokenGroupHookType } from '@subwallet/extension-koni-ui/types';
import { sortTokenByValue } from '@subwallet/extension-koni-ui/utils';
import { SwList } from '@subwallet/react-ui';
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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { multiChainAssetMap } = useSelector((state) => state.assetRegistry);
  const assetRegistry = useChainAssets({ isActive: true }).chainAssetRegistry;

  const tokenBalances = useMemo<TokenBalanceItemType[]>(() => {
    return getTokenBalances(tokenBalanceMap, sortedTokenSlugs).sort(sortTokenByValue);
  }, [tokenBalanceMap, sortedTokenSlugs]);

  const onClickItem = useCallback((item: TokenBalanceItemType) => {
    return () => {
      navigate(`/home/tokens/detail/${item.slug}`);
      onCancel();
    };
  }, [navigate, onCancel]);

  // todo: auto clear search when closing modal, may need update reactUI swList component

  const renderItem = useCallback(
    (tokenBalance: TokenBalanceItemType) => {
      const slug = tokenBalance.slug;
      const tokenName = assetRegistry[slug]?.name || multiChainAssetMap[slug]?.name || '';

      return (
        <TokenBalanceSelectionItem
          key={slug}
          tokenName={tokenName}
          {...tokenBalance}
          onPressItem={onClickItem(tokenBalance)}
        />
      );
    },
    [assetRegistry, multiChainAssetMap, onClickItem]
  );

  const searchFunc = useCallback((item: TokenBalanceItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const chainName = chainInfoMap[item.chain || '']?.name?.toLowerCase();
    const symbol = item.symbol.toLowerCase();

    return (
      symbol.includes(searchTextLowerCase) ||
      chainName.includes(searchTextLowerCase)
    );
  }, [chainInfoMap]);

  const renderEmpty = useCallback(() => {
    return (<TokenEmptyList modalId={id} />);
  }, [id]);

  return (
    <BaseModal
      className={className}
      destroyOnClose={true}
      fullSizeOnMobile
      id={id}
      onCancel={onCancel}
      title={t('Select token')}
    >
      <SwList.Section
        displayRow
        enableSearchInput
        list={tokenBalances}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        rowGap = {'8px'}
        searchFunction={searchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Token name')}
      />
    </BaseModal>
  );
}

export const GlobalSearchTokenModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      paddingLeft: 0,
      paddingRight: 0,
      display: 'flex'
    },

    '.ant-sw-list-section': {
      maxHeight: 'inherit',
      flex: 1
    },

    '.ant-sw-list-search-input': {
      paddingBottom: token.paddingXS
    },

    '.ant-sw-list': {
      paddingRight: token.padding
    }
  });
});
