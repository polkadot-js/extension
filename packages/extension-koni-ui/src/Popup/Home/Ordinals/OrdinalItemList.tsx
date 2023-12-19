// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { ORDINAL_COLLECTION } from '@subwallet/extension-base/constants';
import { OrdinalNftProperties } from '@subwallet/extension-base/types';
import { EmptyList, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector, useSetCurrentPage, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { INftItemDetail } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { IOrdinalItemDetail } from '@subwallet/extension-koni-ui/Popup/Home/Ordinals/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Icon, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Image, Trash } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

import { OrdinalGalleryWrapper } from './components/OrdinalGalleryWrapper';

type Props = ThemeProps;

const subHeaderRightButton = (
  <Icon
    customSize={'24px'}
    phosphorIcon={Trash}
    type='phosphor'
    weight={'light'}
  />
);

const Component: React.FC<Props> = (props: Props) => {
  useSetCurrentPage('/home/ordinals');

  const { className } = props;

  const outletContext: {
    searchInput: string,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setSearchPlaceholder: React.Dispatch<React.SetStateAction<React.ReactNode>>
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>
  } = useOutletContext();
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { nftItems } = useSelector((state) => state.nft);

  const nftList = useMemo(() => {
    return nftItems.filter((item) => item.collectionId === ORDINAL_COLLECTION);
  }, [nftItems]);

  const handleOnClickNft = useCallback((state: INftItemDetail) => {
    navigate('/home/ordinals/item-detail', { state });
  }, [navigate]);

  const renderNft = useCallback((nftItem: NftItem) => {
    const routingParams = { nftItemId: nftItem.id } as IOrdinalItemDetail;

    return (
      <OrdinalGalleryWrapper
        handleOnClick={handleOnClickNft}
        key={`${nftItem.chain}_${nftItem.collectionId}_${nftItem.id}`}
        name={nftItem.name as string}
        properties={nftItem.properties as OrdinalNftProperties}
        routingParams={routingParams}
      />
    );
  }, [handleOnClickNft]);

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

  // const handleDeleteNftCollection = useCallback(() => {
  //   handleSimpleConfirmModal().then(() => {
  //     if (collectionInfo.originAsset) {
  //       deleteCustomAssets(collectionInfo.originAsset)
  //         .then((result) => {
  //           if (result) {
  //             goBack();
  //             showNotification({
  //               message: t('Deleted NFT collection successfully')
  //             });
  //           } else {
  //             showNotification({
  //               message: t('Deleted NFT collection unsuccessfully')
  //             });
  //           }
  //         })
  //         .catch(console.log);
  //     }
  //   }).catch(console.log);
  // }, [collectionInfo.originAsset, goBack, handleSimpleConfirmModal, showNotification, t]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: subHeaderRightButton,
      // onClick: handleDeleteNftCollection,
      disabled: false
    }
  ];

  useEffect(() => {
    if (outletContext) {
      outletContext.setShowSearchInput(false);
    }
  }, [outletContext]);

  return (
    <PageWrapper
      className={CN(className)}
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
          title: t('Ordinals')
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
                    gridGap={'14px'}
                    list={nftList}
                    minColumnWidth={'160px'}
                    renderItem={renderNft}
                    renderOnScroll={true}
                    renderWhenEmpty={emptyNft}
                  />
                </div>
              )}

              <div className={'__delete-nft-button-wrapper'}>
                <Button
                  block={!isWebUI}
                  className={'__delete-nft-button'}
                  disabled={true}
                  icon={(
                    <Icon
                      phosphorIcon={Trash}
                      size='xs'
                    />
                  )}
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
              gridGap={'14px'}
              list={nftList}
              minColumnWidth={'160px'}
              renderItem={renderNft}
              renderOnScroll={true}
              renderWhenEmpty={emptyNft}
            />
          )}
      </Layout.Base>
    </PageWrapper>
  );
};

const OrdinalItemList = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

export default OrdinalItemList;
