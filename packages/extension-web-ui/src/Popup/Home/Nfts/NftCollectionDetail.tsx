// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { _isCustomAsset, _isSmartContractToken } from '@subwallet/extension-base/services/chain-service/utils';
import { EmptyList, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-web-ui/components/NoContent';
import { SHOW_3D_MODELS_CHAIN } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useNavigateOnChangeAccount } from '@subwallet/extension-web-ui/hooks';
import useNotification from '@subwallet/extension-web-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useConfirmModal from '@subwallet/extension-web-ui/hooks/modal/useConfirmModal';
import useDefaultNavigate from '@subwallet/extension-web-ui/hooks/router/useDefaultNavigate';
import useGetChainAssetInfo from '@subwallet/extension-web-ui/hooks/screen/common/useGetChainAssetInfo';
import { deleteCustomAssets } from '@subwallet/extension-web-ui/messaging';
import { NftGalleryWrapper } from '@subwallet/extension-web-ui/Popup/Home/Nfts/component/NftGalleryWrapper';
import { getNftsByCollection, INftCollectionDetail, INftItemDetail } from '@subwallet/extension-web-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, ButtonProps, Icon, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Image, Trash } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

type WrapperProps = ThemeProps;
type Props = ThemeProps & {
  collectionInfo: NftCollection
  nftList: NftItem[]
};

const subHeaderRightButton = (
  <Icon
    customSize={'24px'}
    phosphorIcon={Trash}
    type='phosphor'
    weight={'light'}
  />
);

function Component ({ className = '', collectionInfo, nftList }: Props): React.ReactElement<Props> {
  const outletContext: {
    searchInput: string,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setSearchPlaceholder: React.Dispatch<React.SetStateAction<React.ReactNode>>
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>
  } | undefined = useOutletContext();
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goBack } = useDefaultNavigate();
  const showNotification = useNotification();

  const dataContext = useContext(DataContext);

  useNavigateOnChangeAccount('/home/nfts/collections');

  const originAssetInfo = useGetChainAssetInfo(collectionInfo.originAsset);

  const { handleSimpleConfirmModal } = useConfirmModal({
    title: t<string>('Delete NFT'),
    maskClosable: true,
    closable: true,
    type: 'error',
    subTitle: t<string>('You are about to delete this NFT collection'),
    content: t<string>('Confirm delete this NFT collection'),
    okText: t<string>('Remove')
  });

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
    const routingParams = { collectionId: collectionInfo.collectionId, nftId: nftItem.id } as INftItemDetail;

    return (
      <NftGalleryWrapper
        fallbackImage={collectionInfo.image}
        handleOnClick={handleOnClickNft}
        have3dViewer={SHOW_3D_MODELS_CHAIN.includes(nftItem.chain)}
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
    if (isWebUI) {
      return (
        <NoContent
          className={'__no-content-block'}
          pageType={PAGE_TYPE.NFT_COLLECTION_DETAIL}
        />
      );
    }

    return (
      <EmptyList
        emptyMessage={t('Your NFT collectible will appear here!')}
        emptyTitle={t('No NFT collectible')}
        phosphorIcon={Image}
      />
    );
  }, [isWebUI, t]);

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

  const title = useMemo(() => {
    return (
      <div className={CN('header-content')}>
        <div className={CN('collection-name')}>
          {collectionInfo.collectionName || collectionInfo.collectionId}
        </div>
        <div className={CN('collection-count')}>
            &nbsp;({nftList.length})
        </div>
      </div>
    );
  }, [collectionInfo, nftList]);

  useEffect(() => {
    if (outletContext) {
      outletContext.setDetailTitle?.(title);
      outletContext.setSearchPlaceholder?.('NFTid');
      outletContext.setShowSearchInput?.(true);
    }
  }, [outletContext, title]);

  return (
    <PageWrapper
      className={`${className}`}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
        onBack={onBack}
        {...!isWebUI && {
          showBackButton: true,
          showSubHeader: true,
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderIcons: subHeaderButton,
          subHeaderPaddingVertical: true,
          title: title
        }}
      >
        {isWebUI
          ? (
            <>
              {!!nftList.length && (
                <div className={'nft-item-list-wrapper'}>
                  <SwList
                    className={CN('nft_item_list')}
                    displayGrid={true}
                    enableSearchInput={true}
                    gridGap={'14px'}
                    list={nftList}
                    minColumnWidth={'160px'}
                    renderItem={renderNft}
                    renderOnScroll={true}
                    renderWhenEmpty={emptyNft}
                    searchBy={searchNft}
                    searchMinCharactersCount={2}
                    searchTerm={outletContext?.searchInput}
                  />
                </div>
              )}

              <div className={'__delete-nft-button-wrapper'}>
                <Button
                  block={!isWebUI}
                  className={'__delete-nft-button'}
                  disabled={!(originAssetInfo && _isSmartContractToken(originAssetInfo) && _isCustomAsset(originAssetInfo.slug))}
                  icon={(
                    <Icon
                      phosphorIcon={Trash}
                      size='xs'
                    />
                  )}
                  onClick={handleDeleteNftCollection}
                  type='ghost'
                >
                  {t('Delete this collectible')}
                </Button>
              </div>
            </>
          )
          : (
            <SwList.Section
              autoFocusSearch={false}
              className={CN('nft_item_list__container')}
              displayGrid={true}
              enableSearchInput={true}
              gridGap={'14px'}
              list={nftList}
              minColumnWidth={'160px'}
              renderItem={renderNft}
              renderOnScroll={true}
              renderWhenEmpty={emptyNft}
              searchFunction={searchNft}
              searchMinCharactersCount={2}
              searchPlaceholder={t<string>('Search Nft name or ID')}
            />
          )}
      </Layout.Base>
    </PageWrapper>
  );
}

function WrapperComponent (props: WrapperProps): React.ReactElement<WrapperProps> {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext: {
    nftCollections: NftCollection[],
    nftItems: NftItem[]
  } | undefined = useOutletContext();

  const [collectionDetail] = useState((location.state as INftCollectionDetail | undefined));

  const collectionInfo = useMemo(() => {
    if (!collectionDetail?.collectionId) {
      return;
    }

    return outletContext?.nftCollections?.find((c) => c.collectionId === collectionDetail.collectionId);
  }, [collectionDetail?.collectionId, outletContext?.nftCollections]);

  const nftList = useMemo(() => {
    if (!outletContext?.nftItems || !collectionInfo) {
      return [] as NftItem[];
    }

    return getNftsByCollection(collectionInfo, outletContext?.nftItems);
  }, [collectionInfo, outletContext?.nftItems]);

  const isReady = !!collectionInfo && !!nftList.length;

  useEffect(() => {
    if (!isReady) {
      navigate('/home/nfts/collections');
    }
  }, [collectionInfo, isReady, navigate, nftList.length]);

  if (!isReady) {
    return <></>;
  }

  return (
    <Component
      {...props}
      // @ts-ignore
      collectionInfo={collectionInfo}
      nftList={nftList}
    />
  );
}

const NftCollectionDetail = styled(WrapperComponent)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.header-content': {
      color: token.colorTextBase,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden'
    },

    '.collection-name': {
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.nft_item_list__container': {
      paddingTop: 14,
      flex: 1,
      height: '100%',

      '.ant-sw-list': {
        paddingBottom: 1,
        marginBottom: -1
      }
    },

    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.nft-item-list-wrapper': {
      flex: 1
    },

    '.web-ui-enable &': {
      '.nft-item-list-wrapper': {
        flexGrow: 0
      },

      '.__no-content-block': {
        paddingTop: 92,
        paddingBottom: 132,
        height: 'auto'
      },

      '.__delete-nft-button-wrapper': {
        display: 'flex',
        justifyContent: 'center'
      },

      '.__delete-nft-button': {
        '&:not(:hover)': {
          color: token.colorTextLight4
        }
      }
    }
  });
});

export default NftCollectionDetail;
