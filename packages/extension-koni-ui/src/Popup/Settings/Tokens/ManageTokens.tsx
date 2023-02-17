// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetFungibleTokens from '@subwallet/extension-koni-ui/hooks/screen/settings/useGetFungibleTokens';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ButtonProps, Switch, SwList } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import TokenItem from '@subwallet/react-ui/es/web3-block/token-item';
import { Coin, Plus } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

const TOKENS_PER_PAGE = 10;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;

  const allFungibleTokens = useGetFungibleTokens();
  const [fungibleTokenList, setFungibleTokenList] = useState<_ChainAsset[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setFungibleTokenList(allFungibleTokens.slice(0, TOKENS_PER_PAGE));
    // eslint-disable-next-line
  }, []);

  const loadMoreTokens = useCallback(() => {
    setTimeout(() => { // delayed to avoid lagging on scroll
      if (allFungibleTokens.length > fungibleTokenList.length) {
        const nextPage = page + 1;
        const from = (nextPage - 1) * TOKENS_PER_PAGE;
        const to = from + TOKENS_PER_PAGE > allFungibleTokens.length ? allFungibleTokens.length : (from + TOKENS_PER_PAGE);

        setFungibleTokenList([
          ...fungibleTokenList,
          ...allFungibleTokens.slice(from, to)
        ]);
        setPage(nextPage);
      }
    }, 50);
  }, [allFungibleTokens, fungibleTokenList, page]);

  const searchToken = useCallback((token: _ChainAsset, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      token.name.toLowerCase().includes(searchTextLowerCase) ||
      token.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const renderTokenItem = useCallback((tokenInfo: _ChainAsset) => {
    return (<TokenItem
      dividerPadding={58}
      isShowSubLogo={true}
      key={tokenInfo.slug}
      name={tokenInfo.symbol}
      networkKey={tokenInfo.originChain}
      rightItem={<Switch />}
      subName={tokenInfo.originChain}
      subNetworkKey={tokenInfo.originChain}
      withDivider={true}
    />);
  }, []);

  const emptyTokenList = useCallback(() => {
    return (
      <div className={'nft_empty__container'}>
        <BackgroundIcon
          backgroundColor={token['gray-3']}
          iconColor={token['gray-4']}
          phosphorIcon={Coin}
        />

        <div className={'nft_empty__text__container'}>
          <div className={'nft_empty__title'}>{t<string>('No NFT collectible')}</div>
          <div className={'nft_empty__subtitle'}>{t<string>('Your NFT collectible will appear here!')}</div>
        </div>
      </div>
    );
  }, [t, token]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: <Icon
        phosphorIcon={Plus}
        size='sm'
        type='phosphor'
      />,
      onClick: () => {
        navigate('/settings/tokens/import', { state: { isExternalRequest: false } });
      }
    }
  ];

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <PageWrapper
      className={`manage_tokens ${className}`}
      resolve={dataContext.awaitStores(['assetRegistry'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Manage tokens')}
      >
        <SwList.Section
          className={'manage_tokens__container'}
          enableSearchInput={true}
          gridGap={'14px'}
          list={fungibleTokenList}
          minColumnWidth={'172px'}
          pagination={{
            hasMore: allFungibleTokens.length > fungibleTokenList.length,
            loadMore: loadMoreTokens
          }}
          renderItem={renderTokenItem}
          renderOnScroll={false}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchPlaceholder={t<string>('Search collection name')}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

const ManageTokens = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.manage_tokens__container': {
      paddingTop: 14,
      flex: 1
    }
  });
});

export default ManageTokens;
