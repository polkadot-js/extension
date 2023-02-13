// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { NftGalleryWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/component/NftGalleryWrapper';
import { INftCollectionDetail, INftItemDetail, nftPerPage } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwList, SwSubHeader } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import { Image } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;

  const { collectionInfo, nftList } = location.state as INftCollectionDetail;

  const [page, setPage] = useState(1);
  const [nftList_, setNftList_] = useState<NftItem[]>([]);

  useEffect(() => {
    // init NftCollections_
    setNftList_(nftList.slice(0, nftPerPage));
  }, [nftList]);

  const searchNft = useCallback((nftItem: NftItem, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      nftItem.name?.toLowerCase().includes(searchTextLowerCase) ||
      nftItem.id.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const handleOnClickNft = useCallback((state: INftItemDetail) => {
    navigate('/home/nfts/item-detail', { state });
  }, [navigate]);

  const renderNft = useCallback((nftItem: NftItem) => {
    const routingParams = { collectionInfo, nftItem } as INftItemDetail;

    return (<NftGalleryWrapper
      fallbackImage={collectionInfo.image}
      handleOnClick={handleOnClickNft}
      image={nftItem.image}
      itemCount={nftList.length}
      key={`${nftItem.chain}_${nftItem.collectionId}_${nftItem.id}`}
      routingParams={routingParams}
      title={nftItem.name || nftItem.id}
    />);
  }, [collectionInfo, handleOnClickNft, nftList.length]);

  const loadMoreNfts = useCallback(() => {
    setTimeout(() => { // delayed to avoid lagging on scroll
      if (nftList.length > nftList_.length) {
        const nextPage = page + 1;
        const from = (nextPage - 1) * nftPerPage;
        const to = from + nftPerPage > nftList.length ? nftList.length : (from + nftPerPage);

        setNftList_([
          ...nftList_,
          ...nftList.slice(from, to)
        ]);
        setPage(nextPage);
      }
    }, 100);
  }, [nftList, nftList_, page]);

  const onBack = useCallback(() => {
    navigate('/home/nfts/collections');
  }, [navigate]);

  const emptyNft = useCallback(() => {
    return (
      <div className={'nft_empty__container'}>
        <div className={'nft_empty__icon__wrapper'}>
          <div className={'nft_empty__icon__container'}>
            <Icon
              customSize={'64px'}
              iconColor={token['gray-4']}
              phosphorIcon={Image}
              type='phosphor'
              weight={'fill'}
            />
          </div>
        </div>

        <div className={'nft_empty__text__container'}>
          <div className={'nft_empty__title'}>{t<string>('No NFT collectible')}</div>
          <div className={'nft_empty__subtitle'}>{t<string>('Your NFT collectible will appear here!')}</div>
        </div>
      </div>
    );
  }, [t, token]);

  const getSubHeaderTitle = useCallback(() => {
    const title = collectionInfo.collectionName || collectionInfo.collectionId;

    if (title.length >= 30) {
      return `${title.slice(0, 25)}...`;
    }

    return title;
  }, [collectionInfo.collectionId, collectionInfo.collectionName]);

  return (
    <PageWrapper
      className={`${className}`}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <SwSubHeader
        background={'transparent'}
        center={false}
        onBack={onBack}
        paddingVertical={true}
        showBackButton={true}
        title={`${getSubHeaderTitle()} (${nftList.length})`}
      />
      <SwList.Section
        className={'nft_item_list__container'}
        displayGrid={true}
        enableSearchInput={true}
        gridGap={'14px'}
        list={nftList_}
        minColumnWidth={'172px'}
        pagination={{
          hasMore: nftList.length > nftList_.length,
          loadMore: loadMoreNfts
        }}
        renderItem={renderNft}
        renderOnScroll={false}
        renderWhenEmpty={emptyNft}
        searchFunction={searchNft}
        searchPlaceholder={t<string>('Search Nft name or ID')}
      />
    </PageWrapper>
  );
}

const NftCollectionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,
    paddingBottom: '6px',

    '.nft_item_list__container': {
      paddingTop: 14,
      flex: 1
    },

    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.nft_empty__container': {
      marginTop: '44px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      flexDirection: 'column',
      alignContent: 'center'
    },

    '.nft_empty__icon__wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.nft_empty__icon__container': {
      padding: '24px',
      borderRadius: '50%',
      width: '112px',
      backgroundColor: getAlphaColor(token['gray-3'] as string, 0.1)
    },

    '.nft_empty__text__container': {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },

    '.nft_empty__title': {
      fontWeight: 600,
      textAlign: 'center',
      fontSize: '16px',
      color: token.colorText
    },

    '.nft_empty__subtitle': {
      marginTop: '6px',
      textAlign: 'center',
      color: token.colorTextTertiary
    }
  });
});

export default NftCollectionDetail;
