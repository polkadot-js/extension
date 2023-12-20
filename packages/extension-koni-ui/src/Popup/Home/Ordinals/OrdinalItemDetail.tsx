// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getExplorerLink } from '@subwallet/extension-base/services/transaction-service/utils';
import { OrdinalNftProperties } from '@subwallet/extension-base/types';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useNavigateOnChangeAccount } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import useGetChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import useGetAccountInfoByAddress from '@subwallet/extension-koni-ui/hooks/screen/common/useGetAccountInfoByAddress';
import OrdinalImage from '@subwallet/extension-koni-ui/Popup/Home/Ordinals/components/OrdinalImage';
import { IOrdinalItemDetail } from '@subwallet/extension-koni-ui/Popup/Home/Ordinals/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, Field, Icon, Logo, ModalContext } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import CN from 'classnames';
import { CaretLeft, Info } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type WrapperProps = ThemeProps;
type Props = {
  className?: string;
};

const NFT_DESCRIPTION_MAX_LENGTH = 70;

const modalCloseButton =
  <Icon
    customSize={'24px'}
    phosphorIcon={CaretLeft}
    type='phosphor'
    weight={'light'}
  />;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const navigate = useNavigate();
  const [{ nftItem: { id: nftItemId } }] = useState((location.state as IOrdinalItemDetail));

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const nftItems = useSelector((root: RootState) => root.nft.nftItems);
  const nftItem = useMemo(() => nftItems.find((item) => item.id === nftItemId), [nftItems, nftItemId]);
  const originChainInfo = useGetChainInfo(nftItem?.chain || '');

  const ownerAccountInfo = useGetAccountInfoByAddress(nftItem?.owner || '');
  const accountExternalUrl = getExplorerLink(originChainInfo, nftItem?.owner || '', 'account');

  useNavigateOnChangeAccount('/home/ordinals');

  const ownerPrefix = useCallback(() => {
    if (nftItem?.owner) {
      return (
        <SwAvatar
          identPrefix={originChainInfo.substrateInfo?.addressPrefix}
          size={token.fontSizeXL}
          value={nftItem?.owner}
        />
      );
    }

    return <div />;
  }, [nftItem?.owner, originChainInfo.substrateInfo?.addressPrefix, token.fontSizeXL]);

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
      if (nftItem?.externalUrl) {
        // eslint-disable-next-line no-void
        // void chrome.tabs.create({ url: nftItem.externalUrl, active: true }).then(() => console.log('redirecting'));
        openInNewTab(nftItem.externalUrl)();
      } else {
        console.log('error redirecting to a new tab');
      }
    } catch (e) {
      console.log('error redirecting to a new tab');
    }
  }, [nftItem?.externalUrl]);

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
  }, [activeModal, nftItem?.description]);

  const onCloseNftDescriptionModal = useCallback(() => {
    inactiveModal('nftItemDescription');
  }, [inactiveModal]);

  const onImageClick = useCallback(() => {
    if (nftItem?.externalUrl) {
      chrome.tabs.create({ url: nftItem.externalUrl, active: true })
        .then(() => console.log('redirecting'))
        .catch(console.error);
    }
  }, [nftItem?.externalUrl]);

  const imageSize = isWebUI ? 384 : 358;

  useEffect(() => {
    if (!nftItem) {
      navigate('/home/ordinals');
    }
  }, [navigate, nftItem]);

  if (!nftItem || !originChainInfo) {
    return null;
  }

  return (
    <>
      <Layout.Base
        {...!isWebUI && {
          onBack: goBack,
          showBackButton: true,
          showSubHeader: true,
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderPaddingVertical: true,
          title: nftItem.name || nftItem.id
        }}
      >
        <div className={'nft_item_detail__container'}>
          <div className={'nft_item_detail__nft_image'}>
            <div
              onClick={onImageClick}
              style={{
                height: imageSize,
                width: imageSize
              }}
            >
              <OrdinalImage
                alone={true}
                properties={nftItem.properties as OrdinalNftProperties}
              />
            </div>
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
                  content={(
                    <span>
                      <span>{ownerAccountInfo?.name}</span>
                      <span className={'nft_item_detail__owner_address'}>({`${nftItem.owner.slice(0, 4)}...${nftItem.owner.slice(-4)}`})</span>
                    </span>
                  )}
                  label={t<string>('Owned by')}
                  prefix={nftItem.owner && ownerPrefix()}
                  suffix={externalInfoIcon('account')}
                />

                <Field
                  content={originChainInfo.name}
                  label={t<string>('Network')}
                  prefix={(
                    <Logo
                      network={originChainInfo.slug}
                      shape={'circle'}
                      size={token.fontSizeXL}
                    />
                  )}
                />
              </div>
            </div>

            <div className={'nft_item_detail__prop_section'}>
              <div className={'nft_item_detail__section_title'}>{t<string>('Properties')}</div>
              <div className={'nft_item_detail__atts_container'}>
                <Field
                  className={'nft_item_detail__id_field'}
                  content={nftItem.id}
                  key={'Ordinal ID'}
                  label={'Ordinal ID'}
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
        </div>

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
};

function WrapperComponent (props: WrapperProps): React.ReactElement<WrapperProps> {
  const navigate = useNavigate();
  const location = useLocation();
  const [itemDetail] = useState((location.state as IOrdinalItemDetail));

  const nftItem = itemDetail?.nftItem;
  const originChainInfo = useGetChainInfo(nftItem?.chain || '');

  const dataContext = useContext(DataContext);
  const outletContext: {
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>
  } = useOutletContext();

  const setDetailTitle = outletContext?.setDetailTitle;
  const setShowSearchInput = outletContext?.setShowSearchInput;

  const isEmptyInfo = !nftItem || !originChainInfo;

  const waitReady = useMemo(() => {
    return new Promise((resolve, reject) => {
      dataContext.awaitStores(['nft', 'accountState', 'chainStore']).then(() => {
        if (!isEmptyInfo) {
          resolve(true);
        }
      }).catch(reject);
    });
  }, [dataContext, isEmptyInfo]);

  useEffect(() => {
    if (!nftItem) {
      navigate('/home/ordinals');
    }
  }, [navigate, nftItem]);

  useEffect(() => {
    setShowSearchInput?.(false);

    if (nftItem) {
      setDetailTitle?.(nftItem.name || nftItem.id);
    }
  }, [nftItem, setDetailTitle, setShowSearchInput]);

  return (
    <PageWrapper
      className={`${props.className || ''}`}
      resolve={waitReady}
    >
      {
        !isEmptyInfo && (
          <Component />
        )
      }
    </PageWrapper>
  );
}

const OrdinalItemDetail = styled(WrapperComponent)<WrapperProps>(({ theme: { token } }: WrapperProps) => {
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

export default OrdinalItemDetail;
