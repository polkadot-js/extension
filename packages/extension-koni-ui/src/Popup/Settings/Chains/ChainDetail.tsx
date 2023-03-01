// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getBlockExplorerFromChain, _getChainNativeTokenBasicInfo, _getChainNativeTokenSlug, _getChainSubstrateAddressPrefix, _getCrowdloanUrlFromChain, _getSubstrateParaId, _isChainEvmCompatible, _isCustomChain, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { isUrl } from '@subwallet/extension-base/utils';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetChainAssetInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainAssetInfo';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ChainDetail } from '@subwallet/extension-koni-ui/Popup/Settings/Chains/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Col, Field, Form, Input, Row, Tooltip } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import Icon from '@subwallet/react-ui/es/icon';
import { FloppyDiskBack, Globe, Plus, ShareNetwork, Trash } from 'phosphor-react';
import { FieldData, RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

interface ChainDetailForm {
  currentProvider: string,
  priceId: string,
  blockExplorer: string,
  crowdloanUrl: string
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const showNotification = useNotification();
  const [form] = useForm<ChainDetailForm>();

  const [isChanged, setIsChanged] = useState(false);
  const [isValueValid, setIsValueValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const { chainInfo, chainState } = useMemo(() => {
    return location.state as ChainDetail;
  }, [location.state]);

  const nativeTokenInfo = useGetChainAssetInfo(_getChainNativeTokenSlug(chainInfo));

  const { decimals, symbol } = useMemo(() => {
    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfo]);

  const currentProviderUrl = useMemo(() => {
    return chainInfo.providers[chainState.currentProvider];
  }, [chainInfo.providers, chainState.currentProvider]);

  const paraId = useMemo(() => {
    return _getSubstrateParaId(chainInfo);
  }, [chainInfo]);

  const addressPrefix = useMemo(() => {
    return _getChainSubstrateAddressPrefix(chainInfo);
  }, [chainInfo]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleDeleteCustomChain = useCallback(() => {
    showNotification({
      message: t('delete custom chain')
    });
  }, [showNotification, t]);

  const chainTypeString = useCallback(() => {
    let result = '';
    const types: string[] = [];

    if (_isSubstrateChain(chainInfo)) {
      types.push('Substrate');
    }

    if (_isChainEvmCompatible(chainInfo)) {
      types.push('EVM');
    }

    for (let i = 0; i < types.length; i++) {
      result = result.concat(types[i]);

      if (i !== types.length - 1) {
        result = result.concat(', ');
      }
    }

    return result;
  }, [chainInfo]);

  const formInitValues = useMemo(() => {
    return {
      currentProvider: chainState.currentProvider,
      priceId: nativeTokenInfo?.priceId || '',
      blockExplorer: _getBlockExplorerFromChain(chainInfo),
      crowdloanUrl: _getCrowdloanUrlFromChain(chainInfo)
    } as ChainDetailForm;
  }, [chainInfo, chainState.currentProvider, nativeTokenInfo?.priceId]);

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

  const isSubmitDisabled = useCallback(() => {
    return !isChanged || !isValueValid;
  }, [isChanged, isValueValid]);

  const onSubmit = useCallback(() => {
    setLoading(true);
    console.log('submit', form.getFieldsValue());
  }, [form]);

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

  const onFormValuesChange = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    let isFieldsValid = true;

    for (const changedField of allFields) {
      if (changedField.errors && changedField.errors.length > 0) {
        isFieldsValid = false;
        break;
      }
    }

    setIsChanged(true);
    setIsValueValid(isFieldsValid);
  }, []);

  const optionalUrlValidator = useCallback((rule: RuleObject, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (value.length === 0 || isUrl(value)) {
        resolve();
      } else {
        reject(new Error(t('Crowdloan URL must be a valid URL')));
      }
    });
  }, [t]);

  return (
    <PageWrapper
      className={`chain_detail ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        onBack={onBack}
        rightFooterButton={{
          block: true,
          disabled: isSubmitDisabled(),
          icon: (
            <Icon
              phosphorIcon={FloppyDiskBack}
              type='phosphor'
              weight={'fill'}
            />
          ),
          loading: loading,
          onClick: onSubmit,
          children: 'Save'
        }}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Chain detail')}
      >
        <div className={'chain_detail__container'}>
          <Form
            form={form}
            initialValues={formInitValues}
            onFieldsChange={onFormValuesChange}
          >
            <div className={'chain_detail__attributes_container'}>
              <Form.Item
                name={'currentProvider'}
                noStyle={true}
              >
                <Tooltip
                  placement={'topLeft'}
                  title={t('Provider URL')}
                >
                  <div>
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
                  </div>
                </Tooltip>
              </Form.Item>

              <Row gutter={token.paddingSM}>
                <Col span={16}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Chain name')}
                  >
                    <div>
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
                    </div>
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Symbol')}
                  >
                    <div>
                      <Field
                        content={symbol}
                        placeholder={t('Symbol')}
                      />
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Row gutter={token.paddingSM}>
                <Col span={12}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Decimals')}
                  >
                    <div>
                      <Field
                        content={decimals}
                        placeholder={t('Decimals')}
                      />
                    </div>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('ParaId')}
                  >
                    <div>
                      <Field
                        content={paraId > -1 ? paraId : 'None'}
                        placeholder={t('ParaId')}
                      />
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Tooltip
                placement={'topLeft'}
                title={t('Address prefix')}
              >
                <div>
                  <Field
                    content={addressPrefix.toString()}
                    placeholder={t('Address prefix')}
                  />
                </div>
              </Tooltip>

              <Row gutter={token.paddingSM}>
                <Col span={12}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Price Id (from CoinGecko)')}
                  >
                    <div>
                      <Form.Item
                        name={'priceId'}
                      >
                        <Input
                          placeholder={t('Price Id')}
                        />
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Chain type')}
                  >
                    <div>
                      <Field
                        content={chainTypeString()}
                        placeholder={t('Chain type')}
                      />
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Tooltip
                placement={'topLeft'}
                title={t('Block explorer')}
              >
                <div>
                  <Form.Item
                    name={'blockExplorer'}
                    rules={[{ validator: optionalUrlValidator }]}
                  >
                    <Input placeholder={t('Block explorer')} />
                  </Form.Item>
                </div>
              </Tooltip>

              <Tooltip
                placement={'topLeft'}
                title={t('Crowdloan URL')}
              >
                <div>
                  <Form.Item
                    name={'crowdloanUrl'}
                    rules={[{ validator: optionalUrlValidator }]}
                  >
                    <Input placeholder={t('Crowdloan URL')} />
                  </Form.Item>
                </div>
              </Tooltip>

            </div>
          </Form>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const TokenDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.chain_detail__container': {
      marginTop: 22,
      marginRight: token.margin,
      marginLeft: token.margin
    },

    '.chain_detail__attributes_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM
    },

    '.chain_detail__provider_suffix_btn': {
      height: 'auto'
    },

    '.ant-btn.-size-xs.-icon-only': {
      minWidth: 0
    },

    '.ant-form-item': {
      marginBottom: 0
    }
  });
});

export default TokenDetail;
