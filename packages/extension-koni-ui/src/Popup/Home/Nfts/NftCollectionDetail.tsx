// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { _isCustomAsset, _isSmartContractToken } from '@subwallet/extension-base/services/chain-service/utils';
import { EmptyList, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useConfirmModal from '@subwallet/extension-koni-ui/hooks/modal/useConfirmModal';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import useGetChainAssetInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainAssetInfo';
import { deleteCustomAssets } from '@subwallet/extension-koni-ui/messaging';
import { NftGalleryWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/component/NftGalleryWrapper';
import { INftCollectionDetail, INftItemDetail } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Image, Trash } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

const subHeaderRightButton = <Icon
  customSize={'24px'}
  phosphorIcon={Trash}
  type='phosphor'
  weight={'light'}
/>;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const location = useLocation();
  const navigate = useNavigate();
  const goBack = useDefaultNavigate().goBack;
  const showNotification = useNotification();

  const { handleSimpleConfirmModal } = useConfirmModal({
    title: t<string>('Delete NFT'),
    maskClosable: true,
    closable: true,
    type: 'error',
    subTitle: t<string>('You are about to delete this NFT collection'),
    content: t<string>('Confirm delete this NFT collection'),
    okText: t<string>('Remove')
  });

  const { collectionInfo, nftList } = location.state as INftCollectionDetail;
  const originAssetInfo = useGetChainAssetInfo(collectionInfo.originAsset);

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

    return (
      <NftGalleryWrapper
        fallbackImage={collectionInfo.image}
        handleOnClick={handleOnClickNft}
        image={nftItem.image}
        key={`${nftItem.chain}_${nftItem.collectionId}_${nftItem.id}`}
        routingParams={routingParams}
        title={nftItem.name || nftItem.id}
      />
    );
  }, [collectionInfo, handleOnClickNft]);

  const onBack = useCallback(() => {
    navigate('/home/nfts/collections');
  }, [navigate]);

  const emptyNft = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your NFT collectible will appear here!')}
        emptyTitle={t('No NFT collectible')}
        phosphorIcon={Image}
      />
    );
  }, [t]);

  const getSubHeaderTitle = useCallback(() => {
    const title = collectionInfo.collectionName || collectionInfo.collectionId;

    if (title.length >= 30) {
      return `${title.slice(0, 25)}...`;
    }

    return title;
  }, [collectionInfo.collectionId, collectionInfo.collectionName]);

  const handleDeleteNftCollection = useCallback(() => {
    handleSimpleConfirmModal().then(() => {
      if (collectionInfo.originAsset) {
        deleteCustomAssets(collectionInfo.originAsset)
          .then((result) => {
            if (result) {
              goBack();
              showNotification({
                message: t('Deleted NFT collection successfully')
              });
            } else {
              showNotification({
                message: t('Deleted NFT collection unsuccessfully')
              });
            }
          })
          .catch(console.log);
      }
    }).catch(console.log);
  }, [collectionInfo.originAsset, goBack, handleSimpleConfirmModal, showNotification, t]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: subHeaderRightButton,
      onClick: handleDeleteNftCollection,
      disabled: !(originAssetInfo && _isSmartContractToken(originAssetInfo) && _isCustomAsset(originAssetInfo.slug))
    }
  ];

  return (
    <PageWrapper
      className={`${className}`}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={`${getSubHeaderTitle()} (${nftList.length})`}
      >
        <SwList.Section
          className={CN('nft_item_list__container', { pb: !nftList.length })}
          displayGrid={true}
          enableSearchInput={true}
          gridGap={'14px'}
          ignoreScrollbar={nftList.length > 4}
          list={nftList}
          minColumnWidth={'160px'}
          renderItem={renderNft}
          renderOnScroll={true}
          renderWhenEmpty={emptyNft}
          searchFunction={searchNft}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search Nft name or ID')}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

const NftCollectionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.nft_item_list__container': {
      paddingTop: 14,
      flex: 1,
      height: '100%',

      '&.pb': {
        '.ant-sw-list': {
          paddingBottom: 1
        }
      }
    },

    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  });
});

export default NftCollectionDetail;
