// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { getExplorerLink } from '@subwallet/extension-base/services/transaction-service/utils';
import { Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { CAMERA_CONTROLS_MODEL_VIEWER_PROPS, DEFAULT_MODEL_VIEWER_PROPS, DEFAULT_NFT_PARAMS, NFT_TRANSACTION, SHOW_3D_MODELS_CHAIN, TRANSFER_NFT_MODAL } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useNavigateOnChangeAccount } from '@subwallet/extension-web-ui/hooks';
import useNotification from '@subwallet/extension-web-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useDefaultNavigate from '@subwallet/extension-web-ui/hooks/router/useDefaultNavigate';
import useGetChainInfo from '@subwallet/extension-web-ui/hooks/screen/common/useFetchChainInfo';
import useGetAccountInfoByAddress from '@subwallet/extension-web-ui/hooks/screen/common/useGetAccountInfoByAddress';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { SendNftParams, Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import reformatAddress from '@subwallet/extension-web-ui/utils/account/reformatAddress';
import { BackgroundIcon, Button, ButtonProps, Field, Icon, Image, Logo, ModalContext } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import CN from 'classnames';
import { CaretLeft, Info, PaperPlaneTilt } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

import Transaction from '../../Transaction/Transaction';
import SendNFT from '../../Transaction/variants/SendNFT';
import { INftItemDetail } from './index';

type WrapperProps = ThemeProps;
type Props = WrapperProps & {
  collectionInfo: NftCollection,
  nftItem: NftItem,
  originChainInfo: _ChainInfo
};

const NFT_DESCRIPTION_MAX_LENGTH = 70;

const modalCloseButton =
  <Icon
    customSize={'24px'}
    phosphorIcon={CaretLeft}
    type='phosphor'
    weight={'light'}
  />;

const modalId = TRANSFER_NFT_MODAL;

function Component ({ className = '', collectionInfo,
  nftItem,
  originChainInfo }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const notify = useNotification();

  const navigate = useNavigate();
  const { goBack } = useDefaultNavigate();
  const { token } = useTheme() as Theme;

  const { activeModal, addExclude, checkActive, inactiveModal, removeExclude } = useContext(ModalContext);

  const accounts = useSelector((root: RootState) => root.accountState.accounts);

  const ownerAccountInfo = useGetAccountInfoByAddress(nftItem.owner || '');
  const accountExternalUrl = getExplorerLink(originChainInfo, nftItem.owner, 'account');
  const [sendNftKey, setSendNftKey] = useState<string>('sendNftKey');
  const [, setStorage] = useLocalStorage<SendNftParams>(NFT_TRANSACTION, DEFAULT_NFT_PARAMS);
  const isSendNftModalActive = checkActive(modalId);

  useNavigateOnChangeAccount('/home/nfts/collections');

  const onClickSend = useCallback(() => {
    if (nftItem && nftItem.owner) {
      const ownerAddress = reformatAddress(nftItem.owner, 42);
      const owner = accounts.find((a) => a.address === ownerAddress);

      if (owner?.isReadOnly) {
        notify({
          message: t('The NFT owner is a watch-only account, you cannot send the NFT with it'),
          type: 'info',
          duration: 3
        });

        return;
      }
    }

    setStorage({
      asset: '',
      collectionId: nftItem.collectionId,
      from: nftItem.owner,
      itemId: nftItem.id,
      to: '',
      chain: nftItem.chain
    });

    if (isWebUI) {
      activeModal(modalId);
    } else {
      navigate('/transaction/send-nft');
    }
  }, [accounts, navigate, nftItem, isWebUI, activeModal, notify, setStorage, t]);

  const subHeaderRightButton: ButtonProps[] = [
    {
      children: t<string>('Send'),
      onClick: onClickSend
    }
  ];

  const ownerPrefix = useCallback(() => {
    if (nftItem.owner) {
      const theme = isEthereumAddress(nftItem.owner) ? 'ethereum' : 'polkadot';

      return (
        <SwAvatar
          identPrefix={originChainInfo.substrateInfo?.addressPrefix}
          size={token.fontSizeXL}
          theme={theme}
          value={nftItem.owner}
        />
      );
    }

    return <div />;
  }, [nftItem.owner, originChainInfo.substrateInfo?.addressPrefix, token.fontSizeXL]);

  const originChainLogo = useCallback(() => {
    return (
      <Logo
        network={originChainInfo.slug}
        shape={'circle'}
        size={token.fontSizeXL}
      />
    );
  }, [originChainInfo.slug, token.fontSizeXL]);

  const ownerInfo = useCallback(() => {
    return (
      <span>
        <span>{ownerAccountInfo?.name}</span> <span className={'nft_item_detail__owner_address'}>({`${nftItem?.owner.slice(0, 4)}...${nftItem?.owner.slice(-4)}`})</span>
      </span>
    );
  }, [nftItem?.owner, ownerAccountInfo?.name]);

  const handleClickExternalAccountInfo = useCallback(() => {
    try {
      if (accountExternalUrl) {
        // eslint-disable-next-line no-void
        // void chrome.tabs.create({ url: accountExternalUrl, active: true }).then(() => console.log('redirecting'));
        openInNewTab(accountExternalUrl)();
      } else {
        console.log('error redirecting to a new tab');
      }
    } catch (e) {
      console.log('error redirecting to a new tab');
    }
  }, [accountExternalUrl]);

  const handleClickExternalCollectionInfo = useCallback(() => {
    try {
      if (nftItem.externalUrl) {
        // eslint-disable-next-line no-void
        // void chrome.tabs.create({ url: nftItem.externalUrl, active: true }).then(() => console.log('redirecting'));
        openInNewTab(nftItem.externalUrl)();
      } else {
        console.log('error redirecting to a new tab');
      }
    } catch (e) {
      console.log('error redirecting to a new tab');
    }
  }, [nftItem.externalUrl]);

  const externalInfoIcon = useCallback((type: 'account' | 'collection') => {
    return (
      <div
        className={'nft_item_detail__external_icon'}
        onClick={type === 'account' ? handleClickExternalAccountInfo : handleClickExternalCollectionInfo}
      >
        <Icon
          customSize={'20px'}
          phosphorIcon={Info}
          type='phosphor'
          weight={'light'}
        />
      </div>
    );
  }, [handleClickExternalAccountInfo, handleClickExternalCollectionInfo]);

  const handleShowNftDescription = useCallback(() => {
    if (nftItem?.description && nftItem.description.length > NFT_DESCRIPTION_MAX_LENGTH) {
      activeModal('nftItemDescription');
    }
  }, [activeModal, nftItem.description]);

  const onCloseNftDescriptionModal = useCallback(() => {
    inactiveModal('nftItemDescription');
  }, [inactiveModal]);

  const onImageClick = useCallback(() => {
    if (nftItem.externalUrl) {
      chrome.tabs.create({ url: nftItem.externalUrl, active: true })
        .then(() => console.log('redirecting'))
        .catch(console.error);
    }
  }, [nftItem.externalUrl]);

  const handleCancelModal = useCallback(() => {
    inactiveModal(modalId);
    setSendNftKey(`sendNftKey-${Date.now()}`);
  }, [inactiveModal]);

  const show3DModel = SHOW_3D_MODELS_CHAIN.includes(nftItem.chain);

  const imageSize = isWebUI ? 384 : 358;

  useEffect(() => {
    addExclude(modalId);

    return () => {
      removeExclude(modalId);
    };
  }, [addExclude, removeExclude]);

  return (
    <>
      <Layout.Base
        {...!isWebUI && {
          onBack: goBack,
          showBackButton: true,
          showSubHeader: true,
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderIcons: subHeaderRightButton,
          subHeaderPaddingVertical: true,
          title: nftItem.name || nftItem.id
        }}
      >
        <div className={'nft_item_detail__container'}>
          <div className={'nft_item_detail__nft_image'}>
            <Image
              className={CN({ clickable: nftItem.externalUrl })}
              height={imageSize}
              modelViewerProps={show3DModel ? { ...DEFAULT_MODEL_VIEWER_PROPS, ...CAMERA_CONTROLS_MODEL_VIEWER_PROPS } : undefined}
              onClick={onImageClick}
              src={nftItem.image}
              width={ show3DModel ? imageSize : undefined}
            />

            {isWebUI && (
              <Button
                block
                icon={(
                  <Icon
                    phosphorIcon={PaperPlaneTilt}
                    type='phosphor'
                    weight={'fill'}
                  />
                )}
                onClick={onClickSend}
              >
                <span className={'nft_item_detail__send_text'}>Send</span>
              </Button>
            )}
          </div>

          <div className={'nft_item_detail_field_container'}>
            <div className={'nft_item_detail__info_container'}>
              {!isWebUI && <div className={'nft_item_detail__section_title'}>{t<string>('NFT details')}</div>}

              {isWebUI && !!nftItem.description && (<div className={'nft_item_detail__description'}>
                {nftItem.description}
              </div>)}

              {
                !isWebUI && !!nftItem.description && (
                  <div
                    className={'nft_item_detail__description_container'}
                    onClick={handleShowNftDescription}
                    style={{ cursor: nftItem.description.length > NFT_DESCRIPTION_MAX_LENGTH ? 'pointer' : 'auto' }}
                  >
                    <div className={'nft_item_detail__description_content'}>
                      {nftItem.description.length > NFT_DESCRIPTION_MAX_LENGTH ? `${nftItem.description.slice(0, NFT_DESCRIPTION_MAX_LENGTH)}...` : nftItem.description}
                    </div>
                    <div className={'nft_item_detail__description_title'}>
                      <Icon
                        iconColor={token.colorIcon}
                        phosphorIcon={Info}
                        type='phosphor'
                        weight={'fill'}
                      />
                      <div>{t<string>('Description')}</div>
                    </div>
                  </div>
                )
              }

              <div className='nft_item_detail__info_field_container'>
                <Field
                  content={collectionInfo.collectionName || collectionInfo.collectionId}
                  label={t<string>('NFT collection name')}
                  suffix={nftItem.externalUrl && externalInfoIcon('collection')}
                />

                <Field
                  content={ownerInfo()}
                  label={t<string>('Owned by')}
                  prefix={nftItem.owner && ownerPrefix()}
                  suffix={externalInfoIcon('account')}
                />

                <Field
                  content={originChainInfo.name}
                  label={t<string>('Network')}
                  prefix={originChainLogo()}
                />
              </div>
            </div>

            <div className={'nft_item_detail__prop_section'}>
              <div className={'nft_item_detail__section_title'}>{t<string>('Properties')}</div>
              <div className={'nft_item_detail__atts_container'}>
                <Field
                  className={'nft_item_detail__id_field'}
                  content={nftItem.id}
                  key={'NFT ID'}
                  label={'NFT ID'}
                  width={'fit-content'}
                />

                <Field
                  className={'nft_item_detail__id_field'}
                  content={nftItem.collectionId}
                  key={'Collection ID'}
                  label={'Collection ID'}
                  width={'fit-content'}
                />

                {
                  nftItem.properties && Object.entries(nftItem.properties).map(([attName, attValueObj], index) => {
                    const { value: attValue } = attValueObj as Record<string, string>;

                    return (
                      <Field
                        content={attValue.toString()}
                        key={index}
                        label={attName}
                        width={'fit-content'}
                      />
                    );
                  })
                }
              </div>
            </div>
          </div>

          {!isWebUI && (
            <Button
              block
              icon={(
                <Icon
                  phosphorIcon={PaperPlaneTilt}
                  type='phosphor'
                  weight={'fill'}
                />
              )}
              onClick={onClickSend}
            >
              <span className={'nft_item_detail__send_text'}>{t('Send')}</span>
            </Button>
          )}
        </div>

        <BaseModal
          destroyOnClose
          id={modalId}
          onCancel={handleCancelModal}
          title={t('Transfer')}
        >
          {isSendNftModalActive && (
            <Transaction
              key={sendNftKey}
              modalContent
            >
              <SendNFT
                modalContent
                nftDetail={nftItem}
              />
            </Transaction>
          )}
        </BaseModal>

        <BaseModal
          className={CN('nft_item_detail__description_modal')}
          closeIcon={modalCloseButton}
          id={'nftItemDescription'}
          onCancel={onCloseNftDescriptionModal}
          title={t<string>('Description')}
          wrapClassName={className}
        >
          <div className={'nft_item_detail__description_modal_content'}>
            <div className={'nft_item_detail__description_modal_left_icon'}>
              <BackgroundIcon
                backgroundColor={getAlphaColor(token.colorLink, 0.1)}
                iconColor={token.colorLink}
                phosphorIcon={Info}
                size={'lg'}
                type='phosphor'
                weight={'fill'}
              />
            </div>
            <div className={'nft_item_detail_description_modal_container'}>
              <div className={'nft_item_detail__description_modal_title'}>{nftItem.name || nftItem.id}</div>
              <div className={'nft_item_detail__description_modal_detail'}>
                <pre>{nftItem.description}</pre>
              </div>
            </div>
          </div>
        </BaseModal>
      </Layout.Base>
    </>
  );
}

function WrapperComponent (props: WrapperProps): React.ReactElement<WrapperProps> {
  const navigate = useNavigate();
  const location = useLocation();
  const [itemDetail] = useState((location.state as INftItemDetail | undefined));

  const outletContext: {
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    nftCollections: NftCollection[],
    nftItems: NftItem[]
  } = useOutletContext();

  const collectionInfo = useMemo(() => {
    if (!itemDetail?.collectionId) {
      return;
    }

    return outletContext?.nftCollections?.find((c) => c.collectionId === itemDetail.collectionId);
  }, [itemDetail?.collectionId, outletContext?.nftCollections]);

  const nftItem = useMemo(() => {
    if (!outletContext?.nftItems?.length || !itemDetail?.nftId) {
      return;
    }

    return outletContext?.nftItems?.find((c) => c.id === itemDetail?.nftId);
  }, [itemDetail?.nftId, outletContext?.nftItems]);

  const originChainInfo = useGetChainInfo(nftItem?.chain || '');
  const dataContext = useContext(DataContext);

  const setDetailTitle = outletContext?.setDetailTitle;
  const setShowSearchInput = outletContext?.setShowSearchInput;

  useEffect(() => {
    if (!collectionInfo || !nftItem) {
      navigate('/home/nfts/collections');
    }
  }, [collectionInfo, navigate, nftItem]);

  useEffect(() => {
    setShowSearchInput?.(false);

    if (nftItem) {
      setDetailTitle?.(nftItem.name || nftItem.id);
    }
  }, [nftItem, setDetailTitle, setShowSearchInput]);

  const isEmptyInfo = !collectionInfo || !nftItem || !originChainInfo;

  const waitReady = useMemo(() => {
    return new Promise((resolve, reject) => {
      dataContext.awaitStores(['nft', 'accountState', 'chainStore']).then(() => {
        if (!isEmptyInfo) {
          resolve(true);
        }
      }).catch(reject);
    });
  }, [dataContext, isEmptyInfo]);

  return (
    <PageWrapper
      className={`${props.className || ''}`}
      resolve={waitReady}
    >
      {!isEmptyInfo && (
        <Component
          {...props}
          collectionInfo={collectionInfo}
          nftItem={nftItem}
          originChainInfo={originChainInfo}
        />
      )}
    </PageWrapper>
  );
}

const NftItemDetail = styled(WrapperComponent)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.nft_item_detail__container': {
      marginTop: token.marginSM,
      paddingRight: token.margin,
      paddingLeft: token.margin,
      paddingBottom: token.margin
    },

    '.clickable': {
      cursor: 'pointer'
    },

    '.nft_item_detail__info_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginXS,
      marginTop: token.margin,
      marginBottom: token.margin
    },

    '.nft_item_detail__atts_container': {
      marginTop: token.margin,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.marginXS,
      overflow: 'hidden'
    },

    '.ant-field-container': {
      overflow: 'hidden'
    },

    '.nft_item_detail__section_title': {
      fontSize: token.fontSizeLG,
      color: token.colorTextHeading,
      lineHeight: token.lineHeightLG
    },

    '.nft_item_detail__send_text': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1
    },

    '.nft_item_detail__prop_section': {
      marginBottom: token.margin
    },

    '.nft_item_detail__owner_address': {
      color: token.colorTextDescription
    },

    '.nft_item_detail__external_icon': {
      cursor: 'pointer'
    },

    '.nft_item_detail__description_container': {
      padding: token.paddingSM,
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG
    },

    '.nft_item_detail__description_content': {
      color: token.colorTextDescription,
      fontSize: token.fontSize,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeight,
      wordBreak: 'break-all'
    },

    '.nft_item_detail__description_title': {
      marginTop: token.margin,
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXXS,
      color: token.colorTextLabel,
      fontSize: token.fontSize,
      fontWeight: token.headingFontWeight,
      lineHeight: token.lineHeight
    },

    '.nft_item_detail__description_modal_content': {
      display: 'flex',
      gap: token.marginXS,
      padding: token.paddingSM,
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG
    },

    '.nft_item_detail__description_modal_left_icon': {
      display: 'flex',
      alignItems: 'center'
    },

    '.nft_item_detail__description_modal_title': {
      textAlign: 'left',
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextLight1,
      wordBreak: 'break-all'
    },

    '.nft_item_detail__description_modal_detail': {
      textAlign: 'justify',
      fontWeight: token.bodyFontWeight,
      fontSize: token.fontSizeHeading6,
      color: token.colorTextTertiary,
      wordBreak: 'break-word'
    },

    '.nft_item_detail__nft_image': {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',

      '.ant-image-img': {
        maxWidth: '100%',
        objectFit: 'cover'
      }
    },

    '.nft_item_detail__id_field .ant-field-wrapper .ant-field-content-wrapper .ant-field-content': {
      overflow: 'auto',
      textOverflow: 'initial'
    },

    '.nft_item_detail__info_field_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.web-ui-enable &': {
      '.nft_item_detail__container': {
        marginTop: 0,
        padding: 0,
        display: 'flex',
        gap: token.size,
        flexWrap: 'wrap',
        justifyContent: 'center'
      },

      '.nft_item_detail__nft_image': {
        display: 'flex',
        flexDirection: 'column',
        flexBasis: 384,
        maxWidth: 384,
        gap: token.size,
        alignItems: 'center',
        justifyContent: 'flex-start'
      },

      '.nft_item_detail_field_container': {
        flexGrow: 1,
        flexBasis: 500,
        overflow: 'hidden'
      },

      '.nft_item_detail__description': {
        backgroundColor: token.colorBgSecondary,
        padding: token.paddingSM,
        borderRadius: token.borderRadiusLG,
        color: token.colorTextLight4,
        fontSize: token.fontSize,
        lineHeight: token.lineHeight
      },

      '.nft_item_detail__info_container': {
        marginTop: 0,
        gap: token.size
      },

      '.nft_item_detail__info_field_container': {
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: token.size
      },

      '.nft_item_detail__info_field_container .ant-field-container': {
        flexBasis: 'calc(50% - 8px)'
      },

      '.nft_item_detail__atts_container': {
        gap: token.sizeSM,

        '.ant-field-container .ant-field-label': {
          paddingTop: token.paddingSM,
          top: 0
        },

        '.ant-field-container .ant-field-wrapper': {
          paddingTop: token.paddingXXS,
          paddingBottom: token.paddingSM,
          minHeight: 0
        }
      }
    }
  });
});

export default NftItemDetail;
