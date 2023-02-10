// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { NftGalleryWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/component/NftGalleryWrapper';
import { INftCollectionDetail, nftPerPage } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwList, SwSubHeader } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleOnClickNft = useCallback((state: NftItem) => {
    navigate('/home/nfts/item-detail', { state });
  }, [navigate]);

  const renderNft = useCallback((nftItem: NftItem) => {
    return (<NftGalleryWrapper
      fallbackImage={collectionInfo.image}
      handleOnClick={handleOnClickNft}
      image={nftItem.image}
      itemCount={nftList.length}
      key={`${nftItem.chain}_${nftItem.collectionId}_${nftItem.id}`}
      routingParams={undefined}
      title={nftItem.name || nftItem.id}
    />);
  }, [collectionInfo.image, handleOnClickNft, nftList.length]);

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
        title={`${collectionInfo.collectionName || collectionInfo.collectionId} (${nftList.length})`}
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
        searchFunction={searchNft}
        searchPlaceholder={t<string>('Search Nft name or ID')}
      />
    </PageWrapper>
  );
}

export const NftCollectionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
    }
  });
});
