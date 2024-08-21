// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@subwallet/chain-list/types';
import { _getTokenTypesSupportedByChain, _isChainTestNet, _parseMetadataForSmartContractAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { isValidSubstrateAddress } from '@subwallet/extension-base/utils';
import { AddressInput, ChainSelector, Layout, PageWrapper, TokenTypeSelector } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useChainChecker, useDefaultNavigate, useGetChainPrefixBySlug, useGetFungibleContractSupportedChains, useNotification, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { upsertCustomToken, validateCustomToken } from '@subwallet/extension-web-ui/messaging';
import { FormCallbacks, FormRule, Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertFieldToError, convertFieldToObject, reformatAddress, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Col, Field, Form, Icon, Input, Row } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { PlusCircle } from 'phosphor-react';
import { FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps

interface TokenImportFormType {
  contractAddress: string;
  chain: string;
  type: _AssetType;
  priceId: string;
  tokenName: string;
  decimals: number;
  symbol: string;
}

interface TokenTypeOption {
  label: string,
  value: _AssetType
}

function getTokenTypeSupported (chainInfo: _ChainInfo) {
  if (!chainInfo) {
    return [];
  }

  const tokenTypes = _getTokenTypesSupportedByChain(chainInfo);
  const result: TokenTypeOption[] = [];

  tokenTypes.forEach((tokenType) => {
    if (tokenType !== _AssetType.GRC20) {
      result.push({
        label: tokenType.toString(),
        value: tokenType
      });
    }
  });

  return result;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const showNotification = useNotification();
  const { isWebUI } = useContext(ScreenContext);

  const chainInfoMap = useGetFungibleContractSupportedChains();

  const [form] = Form.useForm<TokenImportFormType>();

  const formDefault = useMemo((): TokenImportFormType => ({
    contractAddress: '',
    chain: '',
    type: '' as _AssetType,
    priceId: '',
    tokenName: '',
    decimals: -1,
    symbol: ''
  }), []);

  const chains = useMemo(() => Object.values(chainInfoMap), [chainInfoMap]);

  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [fieldDisabled, setFieldDisabled] = useState(true);

  const selectedChain = Form.useWatch('chain', form);
  const symbol = Form.useWatch('symbol', form);
  const decimals = Form.useWatch('decimals', form);
  const tokenName = Form.useWatch('tokenName', form);
  const selectedTokenType = Form.useWatch('type', form);

  const chainChecker = useChainChecker();
  const chainNetworkPrefix = useGetChainPrefixBySlug(selectedChain);

  const isSelectGearToken = useMemo(() => {
    return selectedTokenType === _AssetType.VFT;
  }, [selectedTokenType]);

  const tokenTypeOptions = useMemo(() => {
    return getTokenTypeSupported(chainInfoMap[selectedChain]);
  }, [chainInfoMap, selectedChain]);

  const contractRules = useMemo((): FormRule[] => {
    return [
      ({ getFieldValue }) => ({
        validator: (_, contractAddress: string) => {
          return new Promise<void>((resolve, reject) => {
            const selectedTokenType = getFieldValue('type') as _AssetType;
            const isValidEvmContract = [_AssetType.ERC20].includes(selectedTokenType) && isEthereumAddress(contractAddress);
            const isValidWasmContract = [_AssetType.PSP22].includes(selectedTokenType) && isValidSubstrateAddress(contractAddress);
            const isValidGearContract = [_AssetType.VFT].includes(selectedTokenType) && isValidSubstrateAddress(contractAddress);
            const reformattedAddress = isValidGearContract ? contractAddress : reformatAddress(contractAddress, chainNetworkPrefix);

            if (isValidEvmContract || isValidWasmContract || isValidGearContract) {
              setLoading(true);
              validateCustomToken({
                contractAddress: reformattedAddress,
                originChain: selectedChain,
                type: selectedTokenType
              })
                .then((validationResult) => {
                  setLoading(false);

                  if (validationResult.isExist) {
                    reject(new Error(t('Existed token')));
                  }

                  if (validationResult.contractError) {
                    reject(new Error(t('Error validating this token')));
                  }

                  if (!validationResult.isExist && !validationResult.contractError) {
                    form.setFieldValue('tokenName', validationResult.name);
                    form.setFieldsValue({
                      tokenName: validationResult.name,
                      decimals: validationResult.decimals,
                      symbol: validationResult.symbol
                    });
                    resolve();
                  }
                })
                .catch(() => {
                  setLoading(false);
                  reject(new Error(t('Error validating this token')));
                });
            } else {
              reject(t('Invalid contract address'));
            }
          });
        }
      })
    ];
  }, [chainNetworkPrefix, form, selectedChain, t]);

  const onFieldChange: FormCallbacks<TokenImportFormType>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields, ['--priceId', '--tokenName']);

    const changes = convertFieldToObject<TokenImportFormType>(changedFields);
    const all = convertFieldToObject<TokenImportFormType>(allFields);
    const allError = convertFieldToError<TokenImportFormType>(allFields);

    const { chain, type } = changes;

    const baseResetFields = ['tokenName', 'symbol', 'decimals', 'priceId'];

    if (chain) {
      const nftTypes = getTokenTypeSupported(chainInfoMap[chain]);

      if (nftTypes.length === 1) {
        form.setFieldValue('type', nftTypes[0].value);
      } else {
        form.resetFields(['type']);
      }

      form.resetFields(['contractAddress', ...baseResetFields]);
    }

    if (type) {
      form.resetFields(['contractAddress', ...baseResetFields]);
    }

    if (allError.contractAddress.length > 0) {
      form.resetFields([...baseResetFields]);
    }

    setFieldDisabled(!all.chain || !all.type || allError.contractAddress.length > 0);
    setIsDisabled(empty || error);
  }, [chainInfoMap, form]);

  const onSubmit: FormCallbacks<TokenImportFormType>['onFinish'] = useCallback((formValues: TokenImportFormType) => {
    const { chain, contractAddress, decimals, priceId, symbol, tokenName, type } = formValues;

    const reformattedAddress = type === _AssetType.VFT ? contractAddress : reformatAddress(contractAddress, chainNetworkPrefix);

    setLoading(true);

    upsertCustomToken({
      originChain: chain,
      slug: '',
      name: tokenName || symbol,
      symbol,
      decimals,
      priceId: priceId || null,
      minAmount: null,
      assetType: type,
      metadata: _parseMetadataForSmartContractAsset(reformattedAddress),
      multiChainAsset: null,
      hasValue: _isChainTestNet(chainInfoMap[formValues.chain]),
      icon: 'default.png'
    })
      .then((result) => {
        if (result) {
          showNotification({
            message: t('Imported token successfully')
          });
          goBack();
        } else {
          showNotification({
            message: t('An error occurred, please try again')
          });
        }
      })
      .catch(() => {
        showNotification({
          message: t('An error occurred, please try again')
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [chainNetworkPrefix, chainInfoMap, showNotification, t, goBack]);

  const tokenDecimalsPrefix = useCallback(() => {
    const contractAddress = form.getFieldValue('contractAddress') as string;

    const theme = isEthereumAddress(contractAddress) ? 'ethereum' : 'polkadot';

    return (
      <SwAvatar
        identPrefix={42}
        size={token.fontSizeXL}
        theme={theme}
        value={contractAddress}
      />
    );
  }, [token.fontSizeXL, form]);

  useEffect(() => {
    chainChecker(selectedChain);
  }, [chainChecker, selectedChain]);

  return (
    <PageWrapper
      className={`import_token ${className}`}
      resolve={dataContext.awaitStores(['assetRegistry'])}
    >
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        rightFooterButton={{
          block: true,
          disabled: isDisabled,
          icon: (
            <Icon
              phosphorIcon={PlusCircle}
              weight='fill'
            />
          ),
          loading,
          onClick: form.submit,
          children: t('Import token')
        }}
        title={t<string>('Import token')}
      >
        <div className={'import_token__container'}>
          <Form
            className='form-space-sm'
            form={form}
            initialValues={formDefault}
            name={'token-import'}
            onFieldsChange={onFieldChange}
            onFinish={onSubmit}
          >
            <Form.Item
              name={'chain'}
            >
              <ChainSelector
                className={className}
                id='import-nft-select-chain'
                items={chains}
                label={t<string>('Network')}
                placeholder={t('Select network')}
                title={t('Select network')}
              />
            </Form.Item>

            <Form.Item
              name={'type'}
            >
              <TokenTypeSelector
                className={className}
                disabled={!selectedChain}
                items={tokenTypeOptions}
                placeholder={t('Select token type')}
                title={t('Select token type')}
              />
            </Form.Item>

            <Form.Item
              name={'contractAddress'}
              rules={contractRules}
              statusHelpAsTooltip={isWebUI}
            >
              <AddressInput
                addressPrefix={chainNetworkPrefix}
                disabled={!selectedTokenType}
                label={isSelectGearToken ? t('Program ID') : t('Contract address')}
                showScanner={true}
              />
            </Form.Item>

            <Row
              className={'token-symbol-decimals'}
              gutter={token.margin}
            >
              <Col span={12}>
                <Form.Item
                  name={'symbol'}
                >
                  <Field
                    content={symbol}
                    placeholder={t<string>('Symbol')}
                    prefix={tokenDecimalsPrefix()}
                    tooltip={isWebUI ? t('Symbol') : undefined}
                    tooltipPlacement={'topLeft'}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={'decimals'}
                >
                  <Field
                    content={decimals === -1 ? '' : decimals}
                    placeholder={t<string>('Decimals')}
                    tooltip={isWebUI ? t('Decimals') : undefined}
                    tooltipPlacement={'topLeft'}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name={'tokenName'}
              rules={[
                {
                  required: true,
                  message: t('Token name is required')
                }
              ]}
              statusHelpAsTooltip={isWebUI}
            >
              <Field
                content={tokenName}
                placeholder={t<string>('Token name')}
                tooltip={isWebUI ? t('Token name') : undefined}
                tooltipPlacement={'topLeft'}
              />
            </Form.Item>

            <Form.Item
              name={'priceId'}
              statusHelpAsTooltip={isWebUI}
            >
              <Input
                disabled={fieldDisabled}
                placeholder={t('Price ID')}
                tooltip={isWebUI ? t('Price ID') : undefined}
              />
            </Form.Item>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

const FungibleTokenImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.import_token__container': {
      paddingTop: token.padding,
      marginLeft: token.margin,
      marginRight: token.margin
    },

    '.import_token__selected_option': {
      color: token.colorTextHeading
    },

    '.ant-field-container.ant-field-size-medium .ant-field-wrapper': {
      padding: token.paddingSM
    },

    '.token_import__selected_option': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorText
    },

    '.web-ui-enable &': {
      '.ant-sw-screen-layout-body': {
        paddingTop: token.paddingSM,
        flex: '0 0 auto',
        marginBottom: token.marginXS
      },

      '.ant-form .ant-form-item:last-of-type': {
        marginBottom: 0
      },

      '.ant-form .ant-row .ant-form-item': {
        marginBottom: token.marginSM
      }
    }
  });
});

export default FungibleTokenImport;
