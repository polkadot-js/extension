// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _NetworkUpsertParams } from '@subwallet/extension-base/services/chain-service/types';
import { _generateCustomProviderKey, _getChainNativeTokenBasicInfo, _isChainEvmCompatible, _isCustomProvider, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { isUrl } from '@subwallet/extension-base/utils';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import InfoIcon from '@subwallet/extension-koni-ui/components/Icon/InfoIcon';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import { upsertChain, validateCustomChain } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps, ValidateStatus } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Col, Form, Icon, Input, Row } from '@subwallet/react-ui';
import { Globe, ShareNetwork, WifiHigh, WifiSlash } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

interface AddProviderForm {
  provider: string,
  name: string,
  chainType: string,
  symbol: string
}

interface ValidationInfo {
  status: ValidateStatus,
  message?: string
}

function parseProviders (newProvider: string, existingProviders: Record<string, string>) {
  let count = 0;

  Object.keys(existingProviders).forEach((providerKey) => {
    if (_isCustomProvider(providerKey)) {
      count += 1;
    }
  });

  const newProviderKey = _generateCustomProviderKey(count);

  return {
    newProviderKey,
    newProviders: {
      ...existingProviders,
      [newProviderKey]: newProvider
    }
  };
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const showNotification = useNotification();

  const chainSlug = useMemo(() => {
    return location.state as string;
  }, [location.state]);

  const chainInfo = useFetchChainInfo(chainSlug);

  const chainType = useCallback(() => {
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

  const formInitValues = useCallback(() => {
    return {
      provider: '',
      name: chainInfo.name,
      chainType: chainType(),
      symbol: _getChainNativeTokenBasicInfo(chainInfo).symbol
    };
  }, [chainInfo, chainType]);

  const [form] = Form.useForm<AddProviderForm>();
  const [isValidating, setIsValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isShowConnectionStatus, setIsShowConnectionStatus] = useState(false);
  const [providerValidation, setProviderValidation] = useState<ValidationInfo>({ status: '' });

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isSubmitDisabled = useCallback(() => {
    return providerValidation.status !== 'success';
  }, [providerValidation.status]);

  const onSubmit = useCallback(() => {
    setLoading(true);

    const newProvider = form.getFieldValue('provider') as string;

    const { newProviderKey, newProviders } = parseProviders(newProvider.replaceAll(' ', ''), chainInfo.providers);

    const params: _NetworkUpsertParams = {
      mode: 'update',
      chainEditInfo: {
        slug: chainInfo.slug,
        currentProvider: newProviderKey,
        providers: newProviders
      }
    };

    upsertChain(params)
      .then((result) => {
        setLoading(false);

        if (result) {
          showNotification({
            message: t('Added a provider successfully')
          });
          navigate(-1);
        } else {
          showNotification({
            message: t('An error occurred, please try again')
          });
        }
      })
      .catch(() => {
        setLoading(false);
        showNotification({
          message: t('An error occurred, please try again')
        });
      });
  }, [chainInfo.providers, chainInfo.slug, form, navigate, showNotification, t]);

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleErrorMessage = useCallback((errorCode: _CHAIN_VALIDATION_ERROR) => {
    switch (errorCode) {
      case _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE:
        return t('Cannot connect to this provider');
      case _CHAIN_VALIDATION_ERROR.EXISTED_PROVIDER:
        return t('This provider has already been added');
      case _CHAIN_VALIDATION_ERROR.PROVIDER_NOT_SAME_CHAIN:
        return t('This provider is not for this network');
      default:
        return t('Error validating this provider');
    }
  }, [t]);

  const providerSuffix = useCallback(() => {
    if (!isShowConnectionStatus) {
      return <></>;
    }

    if (providerValidation.status === 'success') {
      return (
        <Icon
          customSize={'20px'}
          iconColor={token.colorSuccess}
          phosphorIcon={WifiHigh}
          type={'phosphor'}
          weight={'bold'}
        />
      );
    }

    if (isValidating) {
      return (
        <ActivityIndicator size={'20px'} />
      );
    }

    if (providerValidation.status === 'error') {
      return (
        <Icon
          customSize={'20px'}
          iconColor={token['gray-4']}
          phosphorIcon={WifiSlash}
          type={'phosphor'}
          weight={'bold'}
        />
      );
    }

    return <></>;
  }, [isShowConnectionStatus, isValidating, providerValidation.status, token]);

  const providerValidator = useCallback((rule: RuleObject, provider: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isUrl(provider)) {
        setIsShowConnectionStatus(true);
        setIsValidating(true);
        const parsedProvider = provider.replaceAll(' ', '');

        validateCustomChain(parsedProvider, chainInfo.slug)
          .then((result) => {
            setIsValidating(false);

            if (result.success) {
              resolve();
              setProviderValidation({ status: 'success' });
            }

            if (result.error) {
              reject(new Error(handleErrorMessage(result.error)));
              setProviderValidation({ status: 'error', message: handleErrorMessage(result.error) });
            }
          })
          .catch(() => {
            setIsValidating(false);
            reject(new Error(t('Error validating this provider')));
            setProviderValidation({ status: 'error', message: t('Error validating this provider') });
          });
      } else {
        reject(new Error(t('Provider URL is not valid')));
        setProviderValidation({ status: '' });
        setIsShowConnectionStatus(false);
      }
    });
  }, [chainInfo.slug, handleErrorMessage, t]);

  return (
    <PageWrapper
      className={`add_provider ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        leftFooterButton={{
          onClick: onCancel,
          children: t('Cancel')
        }}
        onBack={onBack}
        rightFooterButton={{
          block: true,
          disabled: isSubmitDisabled(),
          loading: loading,
          onClick: onSubmit,
          children: t('Save')
        }}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={[
          {
            icon: <InfoIcon />
          }
        ]}
        subHeaderPaddingVertical={true}
        title={t<string>('Add new provider')}
      >
        <div className={'add_provider__container'}>
          <div className='description'>
            {t('Currently support WSS provider for Substrate networks and HTTP provider for EVM network')}
          </div>
          <Form
            form={form}
            initialValues={formInitValues()}
          >
            <div className={'add_provider__attributes_container'}>
              <Form.Item
                name={'provider'}
                rules={[{ validator: providerValidator }]}
                statusHelpAsTooltip={true}
                validateTrigger={['onBlur']}
              >
                <Input
                  disabled={isValidating}
                  placeholder={t('Provider URL')}
                  prefix={<Icon
                    customSize={'24px'}
                    iconColor={token['gray-4']}
                    phosphorIcon={ShareNetwork}
                    type={'phosphor'}
                    weight={'bold'}
                  />}
                  suffix={providerSuffix()}
                />
              </Form.Item>

              <Row gutter={token.paddingSM}>
                <Col span={16}>
                  <Form.Item name={'name'}>
                    <Input
                      disabled={true}
                      placeholder={t('Network name')}
                      prefix={(
                        <Icon
                          customSize={'24px'}
                          iconColor={token['gray-4']}
                          phosphorIcon={Globe}
                          type={'phosphor'}
                          weight={'bold'}
                        />
                      )}
                      tooltip={t('Network name')}
                      tooltipPlacement='topLeft'
                      value={chainInfo.name}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name={'symbol'}
                  >
                    <Input
                      disabled={true}
                      placeholder={t('Symbol')}
                      tooltip={t('Symbol')}
                      tooltipPlacement='topLeft'
                      value={chainInfo.slug}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name={'chainType'}>
                <Input
                  disabled={true}
                  placeholder={t('Network type')}
                  tooltip={t('Network type')}
                  tooltipPlacement='topLeft'
                  value={chainInfo.slug}
                />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const AddProvider = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.add_provider__container': {
      padding: token.padding
    },

    '.description': {
      padding: token.padding,
      paddingTop: 0,
      textAlign: 'center',
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '.ant-btn >span': {
      fontSize: token.fontSizeLG
    },

    '.add_provider__attributes_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM
    },

    '.ant-input-container .ant-input-suffix': {
      marginRight: 0,
      marginLeft: token.margin + 2
    },

    '.ant-form-item': {
      marginBottom: 0
    },

    '.ant-input-container .ant-input-affix-wrapper': {
      overflow: 'hidden'
    },

    '.ant-form-item-with-help .ant-form-item-explain': {
      paddingBottom: 0
    }
  });
});

export default AddProvider;
