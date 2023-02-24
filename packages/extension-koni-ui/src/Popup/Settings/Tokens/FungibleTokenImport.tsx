// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@subwallet/chain-list/types';
import { _getTokenTypesSupportedByChain, _isChainTestNet, _parseMetadataForSmartContractAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { isValidSubstrateAddress } from '@subwallet/extension-base/utils';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetContractSupportedChains from '@subwallet/extension-koni-ui/hooks/screen/nft/useGetContractSupportedChains';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { upsertCustomToken, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateStatus } from '@subwallet/extension-koni-ui/types/validator';
import { ButtonProps, Col, Field, Form, Image, Input, NetworkItem, Row, SelectModal } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import Icon from '@subwallet/react-ui/es/icon';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { CheckCircle, Coin, Info, QrCode } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import ChainLogoMap from '../../../assets/logo';
import Layout from '../../../components/Layout';

type Props = ThemeProps

interface TokenImportFormType {
  contractAddress: string,
  chain: string,
  type: _AssetType
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

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const showNotification = useNotification();

  const formRef = useRef<FormInstance<TokenImportFormType>>(null);
  const chainInfoMap = useGetContractSupportedChains();
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [selectedTokenType, setSelectedTokenType] = useState<string>('');
  const [contractValidation, setContractValidation] = useState<ValidationInfo>({ status: '' });
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(-1);

  const tokenTypeOptions = useMemo(() => {
    return getTokenTypeSupported(chainInfoMap[selectedChain]);
  }, [chainInfoMap, selectedChain]);

  const onSubmit = useCallback(() => {
    const formValues = formRef.current?.getFieldsValue() as TokenImportFormType;

    setLoading(true);

    upsertCustomToken({
      originChain: formValues.chain,
      slug: '',
      name,
      symbol,
      decimals,
      priceId: null,
      minAmount: null,
      assetType: formValues.type,
      metadata: _parseMetadataForSmartContractAsset(formValues.contractAddress),
      multiChainAsset: null,
      hasValue: _isChainTestNet(chainInfoMap[formValues.chain])
    })
      .then((result) => {
        setLoading(false);

        if (result) {
          showNotification({
            message: t('Imported token successfully')
          });
          navigate(-1);
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
  }, [name, symbol, decimals, chainInfoMap, showNotification, t, navigate]);

  const isSubmitDisabled = useCallback(() => {
    return contractValidation.status === '' || contractValidation.status === 'error';
  }, [contractValidation.status]);

  const contractAddressValidator = useCallback((rule: RuleObject, contractAddress: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const isValidEvmContract = [_AssetType.ERC20].includes(selectedTokenType as _AssetType) && isEthereumAddress(contractAddress);
      const isValidWasmContract = [_AssetType.PSP22].includes(selectedTokenType as _AssetType) && isValidSubstrateAddress(contractAddress);

      if (isValidEvmContract || isValidWasmContract) {
        setLoading(true);
        validateCustomToken({
          contractAddress,
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
              message: t('Error validating this NFT')
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
  }, [selectedChain, selectedTokenType, t]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <Icon
          phosphorIcon={Info}
          size='sm'
          type='phosphor'
          weight={'light'}
        />,
        onClick: () => {
          navigate('/');
        }
      }
    ];
  }, [navigate]);

  const originChainLogo = useCallback(() => {
    return (
      <Image
        height={token.fontSizeXL}
        shape={'circle'}
        src={ChainLogoMap[selectedChain]}
        width={token.fontSizeXL}
      />
    );
  }, [selectedChain, token.fontSizeXL]);

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
      <div>{tokenTypeOption.label} {selected}</div>
    );
  }, []);

  const renderNftTypeSelected = useCallback((tokenType: TokenTypeOption) => {
    return (
      <div className={'token_import__selected_option'}>{tokenType.label}</div>
    );
  }, []);

  const contractAddressIcon = useCallback(() => {
    const contractAddress = formRef.current?.getFieldValue('contractAddress') as string;
    const theme = isEthereumAddress(contractAddress) ? 'ethereum' : 'polkadot';

    if (contractAddress) {
      return (
        <SwAvatar
          identPrefix={42}
          size={token.fontSizeXL}
          theme={theme}
          value={contractAddress}
        />
      );
    }

    return <SwAvatar
      identPrefix={42}
      size={token.fontSizeXL}
      theme={'beachball'}
      value={''}
    />;
  }, [token.fontSizeXL]);

  const contractAddressQrIcon = useCallback(() => {
    return (
      <div className={'nft_import__Qr'}>
        <Icon
          customSize={'20px'}
          phosphorIcon={QrCode}
          type='phosphor'
          weight={'light'}
        />
      </div>
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

  return (
    <PageWrapper
      className={`import_token ${className}`}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
        footerButton={{
          block: true,
          disabled: isSubmitDisabled(),
          icon: <Icon
            customSize={'28px'}
            phosphorIcon={CheckCircle}
            type='phosphor'
            weight={'fill'}
          />,
          loading,
          onClick: onSubmit,
          children: 'Save'
        }}
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Import token')}
      >
        <div className={'import_token__container'}>
          <div className={'import_token__header_container'}>
            <div className={'import_token__header_icon_wrapper'}>
              <PageIcon
                color={token.colorSecondary}
                iconProps={{
                  phosphorIcon: Coin,
                  weight: 'fill'
                }}
              />
            </div>

            <div className={'import_token__header_text_container'}>
              <div>{t<string>('Import token')}</div>
            </div>
          </div>

          <Form
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
              <SelectModal
                className={className}
                id='import-nft-select-chain'
                itemKey={'slug'}
                items={Object.values(chainInfoMap)}
                label={t<string>('Chain')}
                onSelect={onChangeChain}
                placeholder={t('Select chain')}
                prefix={selectedChain !== '' && originChainLogo()}
                renderItem={renderChainOption}
                renderSelected={renderChainSelected}
                searchFunction={searchChain}
                searchPlaceholder={'Search chain'}
                searchableMinCharactersCount={2}
                selected={selectedChain}
              />
            </Form.Item>

            <Form.Item
              name={'type'}
            >
              <SelectModal
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
              />
            </Form.Item>

            <Form.Item
              name={'contractAddress'}
              rules={[{ validator: contractAddressValidator }]}
            >
              <Input
                disabled={selectedTokenType === ''}
                label={t<string>('Token contract address')}
                prefix={contractAddressIcon()}
                suffix={contractAddressQrIcon()}
              />
            </Form.Item>

            <Row gutter={token.margin}>
              <Col span={12}>
                <Field
                  content={symbol}
                  placeholder={t<string>('Symbol')}
                  prefix={tokenDecimalsPrefix()}
                />
              </Col>
              <Col span={12}>
                <Field
                  content={decimals === -1 ? '' : decimals}
                  placeholder={t<string>('Decimals')}
                />
              </Col>
            </Row>

            <Form.Item
              help={contractValidation.message}
              validateStatus={contractValidation.status}
            />
          </Form>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const FungibleTokenImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.import_token__container': {
      marginLeft: token.margin,
      marginRight: token.margin
    },

    '.import_token__header_container': {
      marginTop: 30,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center',
      marginBottom: token.marginLG
    },

    '.import_token__header_text_container': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeHeading3,
      color: token.colorText
    },

    '.import_token__header_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.import_token__selected_option': {
      color: token.colorTextHeading
    },

    '.ant-field-container.ant-field-size-medium .ant-field-wrapper': {
      padding: token.paddingSM
    }
  });
});

export default FungibleTokenImport;
