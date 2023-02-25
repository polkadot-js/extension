// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetNftByAccount from '@subwallet/extension-koni-ui/hooks/screen/nft/useGetNftByAccount';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { NftGalleryWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/component/NftGalleryWrapper';
import { INftCollectionDetail, NFT_PER_PAGE } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon, SwList } from '@subwallet/react-ui';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import { Image, Plus } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

const rightIcon = <Icon
  phosphorIcon={Plus}
  size='sm'
  type='phosphor'
/>;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;

  const { nftCollections, nftItems } = useGetNftByAccount();

  const [paging, setPaging] = useState(NFT_PER_PAGE);
  const [nftCollections_, setNftCollections_] = useState<NftCollection[]>([]);
  const hasMore = useMemo(() => {
    return nftCollections.length > nftCollections_.length;
  }, [nftCollections.length, nftCollections_.length]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: rightIcon,
      onClick: () => {
        navigate('/settings/tokens/import-nft', { state: { isExternalRequest: false } });
      }
    }
  ];

  useEffect(() => {
    // init NftCollections_
    setNftCollections_(nftCollections.slice(0, NFT_PER_PAGE));
    setPaging(NFT_PER_PAGE);
  }, [nftCollections]);

  const searchCollection = useCallback((collection: NftCollection, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      collection.collectionName?.toLowerCase().includes(searchTextLowerCase) ||
      collection.collectionId.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const getNftsByCollection = useCallback((nftCollection: NftCollection) => {
    const nftList: NftItem[] = [];

    nftItems.forEach((nftItem) => {
      if (nftItem.collectionId === nftCollection.collectionId && nftItem.chain === nftCollection.chain) {
        nftList.push(nftItem);
      }
    });

    return nftList;
  }, [nftItems]);

  const handleOnClickCollection = useCallback((state: INftCollectionDetail) => {
    navigate('/home/nfts/collection-detail', { state });
  }, [navigate]);

  const renderNftCollection = useCallback((nftCollection: NftCollection) => {
    const nftList = getNftsByCollection(nftCollection);

    let fallbackImage: string | undefined;

    for (const nft of nftList) { // fallback to any nft image
      if (nft.image) {
        fallbackImage = nft.image;
        break;
      }
    }

    const state: INftCollectionDetail = { collectionInfo: nftCollection, nftList };

    return (<NftGalleryWrapper
      fallbackImage={fallbackImage}
      handleOnClick={handleOnClickCollection}
      image={nftCollection.image}
      itemCount={nftList.length}
      key={`${nftCollection.collectionId}_${nftCollection.chain}`}
      routingParams={state}
      title={nftCollection.collectionName || nftCollection.collectionId}
    />);
  }, [getNftsByCollection, handleOnClickCollection]);

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

  const loadMoreCollections = useCallback(() => {
    setTimeout(() => { // delayed to avoid lagging on scroll
      if (hasMore) {
        const nextPaging = paging + NFT_PER_PAGE;
        const to = nextPaging > nftCollections.length ? nftCollections.length : nextPaging;

        setNftCollections_(nftCollections.slice(0, to));
        setPaging(nextPaging);
      }
    }, 50);
  }, [hasMore, nftCollections, paging]);

  return (
    <PageWrapper
      className={`nft_container ${className}`}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Collectibles')}
      >
        <SwList.Section
          className={'nft_collection_list__container'}
          displayGrid={true}
          enableSearchInput={true}
          gridGap={'14px'}
          list={nftCollections_}
          minColumnWidth={'172px'}
          pagination={{
            hasMore,
            loadMore: loadMoreCollections
          }}
          renderItem={renderNftCollection}
          renderOnScroll={false}
          renderWhenEmpty={emptyNft}
          searchFunction={searchCollection}
          searchMinCharactersCount={1}
          searchPlaceholder={t<string>('Search collection name')}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

const NftCollections = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.nft_collection_list__container': {
      paddingTop: 14,
      flex: 1
    },

    '.ant-sw-list-wrapper .-render-default': {
      overflow: 'hidden'
    },

    '.nft_empty__container': {
      marginTop: 44,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center'
    },

    '.nft_empty__icon__wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.nft_empty__icon__container': {
      padding: token.paddingLG,
      borderRadius: '50%',
      width: '112px',
      backgroundColor: getAlphaColor(token['gray-3'], 0.1)
    },

    '.nft_empty__text__container': {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },

    '.nft_empty__title': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeLG,
      color: token.colorText
    },

    '.nft_empty__subtitle': {
      marginTop: 6,
      textAlign: 'center',
      color: token.colorTextTertiary
    }
  });
});

export default NftCollections;
