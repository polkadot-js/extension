// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _getContractAddressOfToken, _isSmartContractToken } from '@subwallet/extension-base/services/chain-service/utils';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import useConfirmModal from '@subwallet/extension-koni-ui/hooks/useConfirmModal';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { deleteCustomAssets } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Col, Field, Logo, Row, Tooltip } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { Copy, Trash } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import Layout from '../../../components/Layout';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const showNotification = useNotification();

  const tokenInfo = useMemo(() => {
    return location.state as _ChainAsset;
  }, [location.state]);

  const originChainInfo = useFetchChainInfo(tokenInfo.originChain);

  const { handleSimpleConfirmModal } = useConfirmModal({
    title: t<string>('Delete token'),
    maskClosable: true,
    closable: true,
    type: 'error',
    subTitle: t<string>('You are about to delete this token'),
    content: t<string>('Confirm delete this token'),
    okText: t<string>('Remove')
  });

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleDeleteToken = useCallback(() => {
    handleSimpleConfirmModal().then(() => {
      deleteCustomAssets(tokenInfo.slug)
        .then((result) => {
          if (result) {
            navigate(-1);
            showNotification({
              message: t('Deleted token successfully')
            });
          } else {
            showNotification({
              message: t('Deleted token unsuccessfully')
            });
          }
        })
        .catch(() => {
          showNotification({
            message: t('Deleted token unsuccessfully')
          });
        });
    }).catch(console.log);
  }, [handleSimpleConfirmModal, navigate, showNotification, t, tokenInfo.slug]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: <Icon
        customSize={`${token.fontSizeHeading3}px`}
        phosphorIcon={Trash}
        type='phosphor'
        weight={'light'}
      />,
      onClick: handleDeleteToken,
      disabled: !_isSmartContractToken(tokenInfo)
    }
  ];

  const contractAddressIcon = useCallback(() => {
    const contractAddress = _getContractAddressOfToken(tokenInfo);
    const theme = isEthereumAddress(contractAddress) ? 'ethereum' : 'polkadot';

    return (
      <SwAvatar
        identPrefix={42}
        size={token.fontSizeXL}
        theme={theme}
        value={contractAddress}
      />
    );
  }, [token.fontSizeXL, tokenInfo]);

  const contractAddressInfo = useCallback(() => {
    const contractAddress = _getContractAddressOfToken(tokenInfo);

    return (
      <span>{`${contractAddress.slice(0, 10)}...${contractAddress.slice(-10)}`}</span>
    );
  }, [tokenInfo]);

  const handleCopyContractAddress = useCallback(() => {
    const contractAddress = _getContractAddressOfToken(tokenInfo);

    navigator.clipboard.writeText(contractAddress).then().catch(console.error);

    showNotification({
      message: t('Copied to clipboard')
    });
  }, [showNotification, t, tokenInfo]);

  const contractAddressSuffix = useCallback(() => {
    return (
      <Button
        icon={<Icon
          customSize={'20px'}
          iconColor={token.colorIcon}
          phosphorIcon={Copy}
          type='phosphor'
          weight={'light'}
        />}
        onClick={handleCopyContractAddress}
        size={'xs'}
        type={'ghost'}
      />
    );
  }, [handleCopyContractAddress, token.colorIcon]);

  return (
    <PageWrapper
      className={`token_detail ${className}`}
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
        title={t<string>('Token detail')}
      >
        <div className={'token_detail__container'}>
          <div className={'token_detail__header_container'}>
            <div className={'token_detail__header_icon_wrapper'}>
              <Logo
                size={112}
                token={tokenInfo.symbol}
              />
            </div>

            <div className={'token_detail__header_text_container'}>
              {tokenInfo.symbol}
            </div>
          </div>

          <div className={'token_detail__content_container'}>
            {
              _isSmartContractToken(tokenInfo) && <Field
                content={contractAddressInfo()}
                label={t<string>('Contract address')}
                prefix={contractAddressIcon()}
                suffix={contractAddressSuffix()}
              />
            }
            <Field
              content={originChainInfo.name}
              label={t<string>('Chain')}
              prefix={<Logo
                network={originChainInfo.slug}
                size={20}
              />}
            />

            <Row gutter={token.marginSM}>
              <Col span={12}>
                <Tooltip
                  placement={'topLeft'}
                  title={t('Symbol')}
                >
                  <div>
                    <Field
                      content={tokenInfo.symbol}
                      placeholder={t<string>('Symbol')}
                      prefix={<Logo
                        network={tokenInfo.symbol}
                        size={20}
                      />}
                    />
                  </div>
                </Tooltip>
              </Col>
              <Col span={12}>
                <Tooltip
                  placement={'topLeft'}
                  title={t('Decimals')}
                >
                  <div>
                    <Field
                      content={tokenInfo.decimals}
                      placeholder={t<string>('Decimals')}
                    />
                  </div>
                </Tooltip>
              </Col>
            </Row>
          </div>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const TokenDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.token_detail__container': {
      marginLeft: token.margin,
      marginRight: token.margin
    },

    '.token_detail__header_container': {
      marginTop: 30,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center',
      marginBottom: token.marginLG
    },

    '.token_detail__header_text_container': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeHeading3,
      color: token.colorText
    },

    '.token_detail__header_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.token_detail__content_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM
    },

    '.ant-field-wrapper .ant-btn': {
      margin: -token.marginXS,
      height: 'auto'
    }
  });
});

export default TokenDetail;
