// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@subwallet/chain-list/types';
import { _getTokenTypesSupportedByChain, _isChainTestNet, _parseMetadataForSmartContractAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { isValidSubstrateAddress, reformatAddress } from '@subwallet/extension-base/utils';
import { AddressInput, GeneralEmptyList, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { BaseSelectModal } from '@subwallet/extension-koni-ui/components/Modal/BaseSelectModal';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useChainChecker, useDefaultNavigate, useGetChainPrefixBySlug, useGetContractSupportedChains, useNotification, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { upsertCustomToken, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps, ValidateStatus } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Col, Field, Form, Icon, Image, Input, NetworkItem, Row, SettingItem } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { CheckCircle, Coin, PlusCircle } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps

interface TokenImportFormType {
  contractAddress: string,
  chain: string,
  type: _AssetType,
  priceId: string,
}

interface ValidationInfo {
  status: ValidateStatus,
  message?: string
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
    result.push({
      label: tokenType.toString(),
      value: tokenType
    });
  });

  return result;
}

const renderEmpty = () => <GeneralEmptyList />;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const dataContext = useContext(DataContext);
  const logosMaps = useSelector((state: RootState) => state.settings.logoMaps.chainLogoMap);
  const { token } = useTheme() as Theme;
  const showNotification = useNotification();
  const { isWebUI } = useContext(ScreenContext);

  const formRef = useRef<FormInstance<TokenImportFormType>>(null);
  const chainInfoMap = useGetContractSupportedChains();
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [selectedTokenType, setSelectedTokenType] = useState<string>('');
  const [contractValidation, setContractValidation] = useState<ValidationInfo>({ status: '' });
  const [loading, setLoading] = useState(false);

  const chainChecker = useChainChecker();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(-1);
  const chainNetworkPrefix = useGetChainPrefixBySlug(selectedChain);

  const tokenTypeOptions = useMemo(() => {
    return getTokenTypeSupported(chainInfoMap[selectedChain]);
  }, [chainInfoMap, selectedChain]);

  const onSubmit = useCallback(() => {
    const formValues = formRef.current?.getFieldsValue() as TokenImportFormType;
    const reformattedAddress = reformatAddress(formValues.contractAddress, chainNetworkPrefix);

    setLoading(true);

    upsertCustomToken({
      originChain: formValues.chain,
      slug: '',
      name,
      symbol,
      decimals,
      priceId: formValues.priceId || null,
      minAmount: null,
      assetType: formValues.type,
      metadata: _parseMetadataForSmartContractAsset(reformattedAddress),
      multiChainAsset: null,
      hasValue: _isChainTestNet(chainInfoMap[formValues.chain]),
      icon: 'default.png'
    })
      .then((result) => {
        setLoading(false);

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
      }).catch(() => {
        setLoading(false);
        showNotification({
          message: t('An error occurred, please try again')
        });
      });
  }, [chainNetworkPrefix, name, symbol, decimals, chainInfoMap, showNotification, t, goBack]);

  const isSubmitDisabled = useCallback(() => {
    return contractValidation.status === '' || contractValidation.status === 'error';
  }, [contractValidation.status]);

  const contractAddressValidator = useCallback((rule: RuleObject, contractAddress: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const isValidEvmContract = [_AssetType.ERC20].includes(selectedTokenType as _AssetType) && isEthereumAddress(contractAddress);
      const isValidWasmContract = [_AssetType.PSP22].includes(selectedTokenType as _AssetType) && isValidSubstrateAddress(contractAddress);
      const reformattedAddress = reformatAddress(contractAddress, chainNetworkPrefix);

      if (isValidEvmContract || isValidWasmContract) {
        setLoading(true);
        validateCustomToken({
          contractAddress: reformattedAddress,
          originChain: selectedChain,
          type: selectedTokenType as _AssetType
        })
          .then((validationResult) => {
            setLoading(false);

            if (validationResult.isExist) {
              setContractValidation({
                status: 'error',
                message: t('Existed token')
              });
              resolve();
            }

            if (validationResult.contractError) {
              setContractValidation({
                status: 'error',
                message: t('Error validating this token')
              });
              resolve();
            }

            if (!validationResult.isExist && !validationResult.contractError) {
              setContractValidation({
                status: 'success'
              });
              setSymbol(validationResult.symbol);
              setDecimals(validationResult.decimals);
              setName(validationResult.name);
              resolve();
            }
          })
          .catch(() => {
            setLoading(false);
            setContractValidation({
              status: 'error',
              message: t('Error validating this token')
            });
            resolve();
          });
      } else {
        setContractValidation({
          status: 'error'
        });
        reject(t('Invalid contract address'));
      }
    });
  }, [chainNetworkPrefix, selectedChain, selectedTokenType, t]);

  const originChainLogo = useCallback(() => {
    return (
      <Image
        height={token.fontSizeXL}
        shape={'circle'}
        src={logosMaps[selectedChain]}
        width={token.fontSizeXL}
      />
    );
  }, [logosMaps, selectedChain, token.fontSizeXL]);

  const onChangeChain = useCallback((value: string) => {
    formRef.current?.setFieldValue('chain', value);
    const tokenTypes = getTokenTypeSupported(chainInfoMap[value]);

    if (tokenTypes.length === 1) {
      formRef.current?.setFieldValue('type', tokenTypes[0].value);
      setSelectedTokenType(tokenTypes[0].value);
    } else {
      formRef.current?.resetFields(['type']);
      setSelectedTokenType('');
    }

    formRef.current?.resetFields(['contractAddress']);
    setSelectedChain(value);
    setSymbol('');
    setDecimals(-1);
    setName('');
    setContractValidation({ status: '' });
  }, [chainInfoMap]);

  const onChangeTokenType = useCallback((value: string) => {
    if (selectedTokenType !== value) {
      formRef.current?.resetFields(['contractAddress']);
      setSymbol('');
      setDecimals(-1);
      setName('');
    }

    formRef.current?.setFieldValue('type', value as _AssetType);
    setSelectedTokenType(value);
  }, [selectedTokenType]);

  const searchChain = useCallback((chainInfo: _ChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      chainInfo.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const renderChainOption = useCallback((chainInfo: _ChainInfo, selected: boolean) => {
    return (
      <NetworkItem
        name={chainInfo.name}
        networkKey={chainInfo.slug}
        networkMainLogoShape={'circle'}
        networkMainLogoSize={28}
        rightItem={selected && <Icon
          customSize={'20px'}
          iconColor={token.colorSuccess}
          phosphorIcon={CheckCircle}
          type='phosphor'
          weight={'fill'}
        />}
      />
    );
  }, [token]);

  const renderChainSelected = useCallback((chainInfo: _ChainInfo) => {
    return (
      <div className={'import_token__selected_option'}>{chainInfo.name}</div>
    );
  }, []);

  const renderTokenTypeOption = useCallback((tokenTypeOption: TokenTypeOption, selected: boolean) => {
    return (
      <SettingItem
        className='token-type-item'
        leftItemIcon={(
          <BackgroundIcon
            backgroundColor='var(--token-type-icon-bg-color)'
            iconColor='var(--token-type-icon-color)'
            phosphorIcon={Coin}
            size='sm'
            weight='fill'
          />
        )}
        name={tokenTypeOption.label}
        rightItem={
          selected &&
            (
              <Icon
                iconColor='var(--token-selected-icon-color)'
                phosphorIcon={CheckCircle}
                size='sm'
                weight='fill'
              />
            )
        }
      />
    );
  }, []);

  const renderNftTypeSelected = useCallback((tokenType: TokenTypeOption) => {
    return (
      <div className={'token_import__selected_option'}>{tokenType.label}</div>
    );
  }, []);

  const tokenDecimalsPrefix = useCallback(() => {
    const contractAddress = formRef.current?.getFieldValue('contractAddress') as string;

    const theme = isEthereumAddress(contractAddress) ? 'ethereum' : 'polkadot';

    return (
      <SwAvatar
        identPrefix={42}
        size={token.fontSizeXL}
        theme={theme}
        value={contractAddress}
      />
    );
  }, [token.fontSizeXL]);

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
          disabled: isSubmitDisabled(),
          icon: (
            <Icon
              phosphorIcon={PlusCircle}
              weight='fill'
            />
          ),
          loading,
          onClick: onSubmit,
          children: t('Import token')
        }}
        title={t<string>('Import token')}
      >
        <div className={'import_token__container'}>
          <Form
            className={'form-space-sm'}
            initialValues={{
              contractAddress: '',
              chain: '',
              type: ''
            }}
            name={'token-import'}
            ref={formRef}
          >
            <Form.Item
              name={'chain'}
            >
              <BaseSelectModal
                className={className}
                id='import-nft-select-chain'
                itemKey={'slug'}
                items={Object.values(chainInfoMap)}
                label={t<string>('Network')}
                onSelect={onChangeChain}
                placeholder={t('Select network')}
                prefix={selectedChain !== '' && originChainLogo()}
                renderItem={renderChainOption}
                renderSelected={renderChainSelected}
                renderWhenEmpty={renderEmpty}
                searchFunction={searchChain}
                searchMinCharactersCount={2}
                searchPlaceholder={t('Search network')}
                selected={selectedChain}
                title={t('Select network')}
              />
            </Form.Item>

            <Form.Item
              name={'type'}
            >
              <BaseSelectModal
                className={className}
                disabled={selectedChain === ''}
                id='import-token-select-type'
                itemKey={'value'}
                items={tokenTypeOptions}
                label={t<string>('Token type')}
                onSelect={onChangeTokenType}
                placeholder={t('Select token type')}
                renderItem={renderTokenTypeOption}
                renderSelected={renderNftTypeSelected}
                selected={selectedTokenType}
                title={t('Select token type')}
              />
            </Form.Item>

            <Form.Item
              name={'contractAddress'}
              rules={[{ validator: contractAddressValidator }]}
              statusHelpAsTooltip={isWebUI}
            >
              <AddressInput
                {
                  ...
                  (
                    (!!contractValidation.status && contractValidation.status !== 'validating')
                      ? {
                        statusHelp: contractValidation.message,
                        status: contractValidation.status
                      }
                      : {}
                  )
                }
                addressPrefix={chainNetworkPrefix}
                disabled={selectedTokenType === ''}
                label={t('Contract address')}
                showScanner={true}
              />
            </Form.Item>

            <Row
              className={'token-symbol-decimals'}
              gutter={token.margin}
            >
              <Col span={12}>
                <Field
                  content={symbol}
                  placeholder={t<string>('Symbol')}
                  prefix={tokenDecimalsPrefix()}
                  tooltip={isWebUI ? t('Symbol') : undefined}
                  tooltipPlacement={'topLeft'}
                />
              </Col>
              <Col span={12}>
                <Field
                  content={decimals === -1 ? '' : decimals}
                  placeholder={t<string>('Decimals')}
                  tooltip={isWebUI ? t('Decimals') : undefined}
                  tooltipPlacement={'topLeft'}
                />
              </Col>
            </Row>

            <Form.Item
              name={'priceId'}
              statusHelpAsTooltip={isWebUI}
            >
              <Input
                disabled={selectedTokenType === ''}
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

    '.token-symbol-decimals': {
      marginBottom: token.margin
    },

    '.token-type-item': {
      '--token-type-icon-bg-color': token['orange-6'],
      '--token-type-icon-color': token.colorWhite,
      '--token-selected-icon-color': token.colorSuccess,

      '.ant-web3-block-right-item': {
        marginRight: 0
      }
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
      }
    }
  });
});

export default FungibleTokenImport;
