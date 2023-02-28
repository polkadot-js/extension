// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import {
  _getChainNativeTokenBasicInfo,
  _getSubstrateParaId,
  _isCustomChain
} from '@subwallet/extension-base/services/chain-service/utils';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ChainDetail } from '@subwallet/extension-koni-ui/Popup/Settings/Chains/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Col, Field, Row } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import {Globe, Plus, ShareNetwork, Trash} from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const showNotification = useNotification();

  const { chainInfo, chainState } = useMemo(() => {
    return location.state as ChainDetail;
  }, [location.state]);

  const {decimals, symbol} = useMemo(() => {
    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfo]);

  const currentProviderUrl = useMemo(() => {
    return chainInfo.providers[chainState.currentProvider];
  }, [chainInfo.providers, chainState.currentProvider]);

  const paraId = useMemo(() => {
    return _getSubstrateParaId(chainInfo);
  }, [chainInfo]);

  const

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleDeleteCustomChain = useCallback(() => {
    showNotification({
      message: t('delete custom chain')
    });
  }, [showNotification, t]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: <Icon
        customSize={`${token.fontSizeHeading3}px`}
        phosphorIcon={Trash}
        type='phosphor'
        weight={'light'}
      />,
      onClick: handleDeleteCustomChain,
      disabled: !_isCustomChain(chainInfo.slug)
    }
  ];

  const handleClickProviderSuffix = useCallback(() => {
    console.log('click suffix');
  }, []);

  const providerFieldSuffix = useCallback(() => {
    return (
      <Button
        className={'chain_detail__provider_suffix_btn'}
        icon={<Icon
          customSize={'20px'}
          phosphorIcon={Plus}
          type={'phosphor'}
          weight={'bold'}
        />}
        onClick={handleClickProviderSuffix}
        size={'xs'}
        type={'ghost'}
      />
    );
  }, [handleClickProviderSuffix]);

  return (
    <PageWrapper
      className={`chain_detail ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Chain detail')}
      >
        <div className={'chain_detail__container'}>
          <Field
            content={currentProviderUrl}
            placeholder={t('Provider URL')}
            prefix={<Icon
              customSize={'24px'}
              iconColor={token['gray-4']}
              phosphorIcon={ShareNetwork}
              type={'phosphor'}
              weight={'bold'}
            />}
            suffix={providerFieldSuffix()}
          />

          <Row gutter={token.paddingSM}>
            <Col span={16}>
              <Field
                content={chainInfo.name}
                placeholder={t('Chain name')}
                prefix={<Icon
                  customSize={'24px'}
                  iconColor={token['gray-4']}
                  phosphorIcon={Globe}
                  type={'phosphor'}
                  weight={'bold'}
                />}
              />
            </Col>
            <Col span={8}>
              <Field
                content={symbol}
                placeholder={t('Symbol')}
              />
            </Col>
          </Row>

          <Row gutter={token.paddingSM}>
            <Col span={12}>
              <Field
                content={decimals}
                placeholder={t('Decimals')}
              />
            </Col>
            <Col span={12}>
              <Field
                content={paraId > -1 ? paraId : 'None'}
                placeholder={t('ParaId')}
              />
            </Col>
          </Row>

          <Field
            content={}
            placeholder={t('Address prefix')}
          />

          <Row gutter={token.paddingSM}>
            <Col span={12}>
              <Field content={'PriceId'} />
            </Col>
            <Col span={12}>
              <Field content={'Chain type'} />
            </Col>
          </Row>

          <Field content={'Block explorer'} />

          <Field content={'Crowdloan Url'} />
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const TokenDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.chain_detail__container': {
      marginRight: token.margin,
      marginLeft: token.margin,
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM
    },

    '.chain_detail__provider_suffix_btn': {
      height: 'auto'
    },

    '.ant-btn.-size-xs.-icon-only': {
      minWidth: 0
    }
  });
});

export default TokenDetail;
