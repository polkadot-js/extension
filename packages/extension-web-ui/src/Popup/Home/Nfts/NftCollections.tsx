// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { EmptyList, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-web-ui/components/NoContent';
import { IMPORT_NFT_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useNotification, useSetCurrentPage, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron } from '@subwallet/extension-web-ui/messaging';
import { NftGalleryWrapper } from '@subwallet/extension-web-ui/Popup/Home/Nfts/component/NftGalleryWrapper';
import { getNftsByCollection, INftCollectionDetail } from '@subwallet/extension-web-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ActivityIndicator, Button, ButtonProps, Icon, ModalContext, SwList, useExcludeModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowClockwise, Image, Plus, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

import NftImport from './NftImport';

type Props = ThemeProps

const reloadIcon = (
  <Icon
    phosphorIcon={ArrowClockwise}
    size='sm'
    type='phosphor'
  />
);

const rightIcon = (
  <Icon
    phosphorIcon={Plus}
    size='sm'
    type='phosphor'
  />
);

const modalId = IMPORT_NFT_MODAL;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  useSetCurrentPage('/home/nfts/collections');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const outletContext: {
    searchInput: string,
    setSearchPlaceholder: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>,
    nftCollections: NftCollection[],
    nftItems: NftItem[]
  } = useOutletContext();

  const setSearchPlaceholder = outletContext?.setSearchPlaceholder;
  const setShowSearchInput = outletContext?.setShowSearchInput;
  const nftCollections = useMemo(() => {
    return outletContext?.nftCollections || [];
  }, [outletContext?.nftCollections]);
  const nftItems = useMemo(() => {
    return outletContext?.nftItems || [];
  }, [outletContext?.nftItems]);

  const { isWebUI } = useContext(ScreenContext);

  useExcludeModal(modalId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const notify = useNotification();

  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [importNftKey, setImportNftKey] = useState<string>('importNftKey');

  useEffect(() => {
    setSearchPlaceholder?.('Collectible name');
    setShowSearchInput?.(true);
  }, [setSearchPlaceholder, setShowSearchInput]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: reloadIcon,
      disabled: loading,
      size: 'sm',
      onClick: () => {
        setLoading(true);
        notify({
          icon: <ActivityIndicator size={32} />,
          style: { top: 210 },
          direction: 'vertical',
          duration: 1.8,
          closable: false,
          message: t('Reloading')
        });

        reloadCron({ data: 'nft' })
          .then(() => {
            setLoading(false);
          })
          .catch(console.error);
      }
    },
    {
      icon: rightIcon,
      onClick: () => {
        navigate('/settings/tokens/import-nft', { state: { isExternalRequest: false } });
      }
    }
  ];

  const searchCollection = useCallback((collection: NftCollection, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      collection.collectionName?.toLowerCase().includes(searchTextLowerCase) ||
      collection.collectionId.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const handleOnClickCollection = useCallback((state: INftCollectionDetail) => {
    navigate('/home/nfts/collection-detail', { state });
  }, [navigate]);

  const renderNftCollection = useCallback((nftCollection: NftCollection) => {
    const nftList = getNftsByCollection(nftCollection, nftItems);

    let fallbackImage: string | undefined;

    for (const nft of nftList) { // fallback to any nft image
      if (nft.image) {
        fallbackImage = nft.image;
        break;
      }
    }

    const state: INftCollectionDetail = { collectionId: nftCollection.collectionId };

    return (
      <NftGalleryWrapper
        fallbackImage={fallbackImage}
        handleOnClick={handleOnClickCollection}
        image={nftCollection.image}
        itemCount={nftList.length}
        key={`${nftCollection.collectionId}_${nftCollection.chain}`}
        routingParams={state}
        title={nftCollection.collectionName || nftCollection.collectionId}
      />
    );
  }, [handleOnClickCollection, nftItems]);

  const emptyButtonProps = useMemo((): ButtonProps => {
    return {
      icon: (
        <Icon
          phosphorIcon={PlusCircle}
          weight='fill'
        />
      ),
      children: t('Add NFT'),
      shape: 'circle',
      size: 'xs',
      onClick: () => {
        navigate('/settings/tokens/import-nft', { state: { isExternalRequest: false } });
      }
    };
  }, [navigate, t]);

  const emptyNft = useCallback(() => {
    if (isWebUI) {
      return (
        <NoContent
          className={'__no-content-block'}
          pageType={PAGE_TYPE.NFT_COLLECTION}
        />
      );
    }

    return (
      <EmptyList
        buttonProps={emptyButtonProps}
        emptyMessage={t('Try adding one manually')}
        emptyTitle={t('No NFTs found')}
        phosphorIcon={Image}
      />
    );
  }, [emptyButtonProps, isWebUI, t]);

  const openImportModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const closeImportModal = useCallback(() => {
    inactiveModal(modalId);
    setImportNftKey(`importNftKey-${Date.now()}`);
  }, [inactiveModal]);

  const listSection = useMemo(() => {
    if (!isWebUI) {
      return (
        <SwList.Section
          autoFocusSearch={false}
          className={CN('nft_collection_list__container')}
          displayGrid={true}
          enableSearchInput={true}
          gridGap={'14px'}
          list={nftCollections}
          minColumnWidth={'160px'}
          renderItem={renderNftCollection}
          renderOnScroll={true}
          renderWhenEmpty={emptyNft}
          searchFunction={searchCollection}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search collection name')}
        />
      );
    }

    if (nftCollections.length > 0) {
      return (
        <div className={'nft-collect-list-wrapper'}>
          <SwList
            displayGrid={true}
            gridGap={'16px'}
            list={nftCollections}
            minColumnWidth={'160px'}
            renderItem={renderNftCollection}
            renderOnScroll={true}
            renderWhenEmpty={emptyNft}
            searchBy={searchCollection}
            searchMinCharactersCount={2}
            searchTerm={outletContext?.searchInput}
          />
        </div>
      );
    }

    return (
      <NoContent
        className={'__no-content-block'}
        pageType={PAGE_TYPE.NFT_COLLECTION}
      />
    );
  }, [isWebUI, nftCollections, renderNftCollection, emptyNft, searchCollection, outletContext?.searchInput, t]);

  return (
    <PageWrapper
      className={`nft_container ${className}`}
    >
      <Layout.Base
        {...!isWebUI && {
          showSubHeader: true,
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderIcons: subHeaderButton,
          subHeaderPaddingVertical: true,
          title: t<string>('Collectibles')
        }}
      >
        {listSection}
        {
          isWebUI && (
            <div className={'__import-collectible-button-wrapper'}>
              <Button
                className={'__import-collectible-button'}
                icon={(
                  <Icon
                    phosphorIcon={PlusCircle}
                    weight='fill'
                  />
                )}
                onClick={openImportModal}
                size={'xs'}
                type='ghost'
              >
                {t('Import collectible')}
              </Button>
            </div>
          )
        }
      </Layout.Base>

      <BaseModal
        className={CN('import-nft-modal', className)}
        id={modalId}
        onCancel={closeImportModal}
        title={t('Import NFT')}
      >
        <NftImport
          key={importNftKey}
          modalContent
          onSubmitCallback={closeImportModal}
        />
      </BaseModal>
    </PageWrapper>
  );
}

const NftCollections = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.nft_container': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,

      '&__inner': {
        display: 'flex',
        flexDirection: 'column'
      },

      '.nft_collection_list__container': {
        height: '100%',
        flex: 1,

        '.ant-sw-list': {
          paddingBottom: 1,
          marginBottom: -1
        }
      },

      '.nft-collect-list-wrapper': {
        flex: 1
      },

      '.web-ui-enable &': {
        '.__no-content-block': {
          paddingTop: 92,
          paddingBottom: 132,
          height: 'auto'
        },

        '.__import-collectible-button-wrapper': {
          display: 'flex',
          justifyContent: 'center'
        },

        '.__import-collectible-button': {
          '&:not(:hover)': {
            color: token.colorTextLight4
          }
        },

        '.nft-collect-list-wrapper': {
          flexGrow: 0
        },

        '.nft-collect-list-wrapper + .__import-collectible-button-wrapper': {
          marginTop: token.marginXS
        }
      }
    },
    '&.import-nft-modal': {
      '.ant-sw-modal-body': {
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0
      },

      '.nft_import__container': {
        marginTop: token.marginXS,
        marginBottom: token.marginXS
      },

      '.ant-sw-screen-layout-container .ant-sw-screen-layout-footer-button-container-alone': {
        marginBottom: token.margin
      },

      '.ant-form': {
        display: 'flex',
        flexDirection: 'column',
        gap: token.sizeXS
      }
    }
  });
});

export default NftCollections;
