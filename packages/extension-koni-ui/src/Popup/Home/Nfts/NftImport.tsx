// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@subwallet/chain-list/types';
import { _getNftTypesSupportedByChain, _isChainTestNet, _parseMetadataForSmartContractAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { isValidSubstrateAddress } from '@subwallet/extension-base/utils';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetContractSupportedChains from '@subwallet/extension-koni-ui/hooks/screen/nft/useGetContractSupportedChains';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { upsertCustomToken, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateStatus } from '@subwallet/extension-koni-ui/types/validator';
import { Form, Icon, Image, Input, NetworkItem, SelectModal } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { CheckCircle, QrCode } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import LogosMap from '../../../assets/logo';

type Props = ThemeProps

interface NftImportFormType {
  contractAddress: string,
  chain: string,
  collectionName: string,
  type: _AssetType,
  symbol: string
}

interface ValidationInfo {
  status: ValidateStatus,
  message?: string
}

interface NftTypeOption {
  label: string,
  value: _AssetType
}

function getNftTypeSupported (chainInfo: _ChainInfo) {
  if (!chainInfo) {
    return [];
  }

  const nftTypes = _getNftTypesSupportedByChain(chainInfo);
  const result: NftTypeOption[] = [];

  nftTypes.forEach((nftType) => {
    result.push({
      label: nftType.toString(),
      value: nftType
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

  const formRef = useRef<FormInstance<NftImportFormType>>(null);
  const chainInfoMap = useGetContractSupportedChains();
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [selectedNftType, setSelectedNftType] = useState<string>('');
  const [contractValidation, setContractValidation] = useState<ValidationInfo>({ status: '' });
  const [symbol, setSymbol] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const nftTypeOptions = useMemo(() => {
    return getNftTypeSupported(chainInfoMap[selectedChain]);
  }, [chainInfoMap, selectedChain]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const onSubmit = useCallback(() => {
    const formValues = formRef.current?.getFieldsValue() as NftImportFormType;
    const formattedCollectionName = formValues.collectionName.replaceAll(' ', '').toUpperCase();

    setLoading(true);

    upsertCustomToken({
      originChain: formValues.chain,
      slug: '',
      name: formValues.collectionName,
      symbol: symbol !== '' ? symbol : formattedCollectionName,
      decimals: null,
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
            message: t('Imported NFT successfully')
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
  }, [symbol, chainInfoMap, showNotification, t, navigate]);

  const isSubmitDisabled = useCallback(() => {
    return contractValidation.status === '' || contractValidation.status === 'error';
  }, [contractValidation.status]);

  const onChangeChain = useCallback((value: string) => {
    formRef.current?.setFieldValue('chain', value);
    const nftTypes = getNftTypeSupported(chainInfoMap[value]);

    if (nftTypes.length === 1) {
      formRef.current?.setFieldValue('type', nftTypes[0].value);
      setSelectedNftType(nftTypes[0].value);
    } else {
      formRef.current?.resetFields(['type']);
      setSelectedNftType('');
    }

    formRef.current?.resetFields(['contractAddress', 'collectionName']);
    setSelectedChain(value);
    setContractValidation({ status: '' });
  }, [chainInfoMap]);

  const onChangeNftType = useCallback((value: string) => {
    if (selectedNftType !== value) {
      formRef.current?.resetFields(['contractAddress', 'collectionName']);
    }

    formRef.current?.setFieldValue('type', value as _AssetType);
    setSelectedNftType(value);
  }, [selectedNftType]);

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

  const renderNftTypeOption = useCallback((nftType: NftTypeOption, selected: boolean) => {
    return (
      <div>{nftType.label} {selected}</div>
    );
  }, []);

  const renderNftTypeSelected = useCallback((nftType: NftTypeOption) => {
    return (
      <div className={'nft_import__selected_option'}>{nftType.label}</div>
    );
  }, []);

  const renderChainSelected = useCallback((chainInfo: _ChainInfo) => {
    return (
      <div className={'nft_import__selected_option'}>{chainInfo.name}</div>
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

  const originChainLogo = useCallback(() => {
    return (
      <Image
        height={token.fontSizeXL}
        shape={'circle'}
        src={LogosMap[selectedChain]}
        width={token.fontSizeXL}
      />
    );
  }, [selectedChain, token.fontSizeXL]);

  const collectionNameValidator = useCallback((rule: RuleObject, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (value.length >= 3) {
        resolve();
      } else {
        reject(new Error(t('Collection name must have at least 3 characters')));
      }
    });
  }, [t]);

  const contractAddressValidator = useCallback((rule: RuleObject, contractAddress: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const isValidEvmContract = [_AssetType.ERC721].includes(selectedNftType as _AssetType) && isEthereumAddress(contractAddress);
      const isValidWasmContract = [_AssetType.PSP34].includes(selectedNftType as _AssetType) && isValidSubstrateAddress(contractAddress);

      if (isValidEvmContract || isValidWasmContract) {
        setLoading(true);
        validateCustomToken({
          contractAddress,
          originChain: selectedChain,
          type: selectedNftType as _AssetType
        })
          .then((validationResult) => {
            setLoading(false);

            if (validationResult.isExist) {
              setContractValidation({
                status: 'error',
                message: t('Existed NFT')
              });
              resolve();
            }

            if (validationResult.contractError) {
              setContractValidation({
                status: 'error',
                message: t('Error validating this NFT')
              });
              resolve();
            }

            if (!validationResult.isExist && !validationResult.contractError) {
              setContractValidation({
                status: 'success'
              });
              formRef.current?.setFieldValue('collectionName', validationResult.name);
              setSymbol(validationResult.symbol);
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
  }, [selectedChain, selectedNftType, t]);

  const isCollectionNameDisabled = useCallback(() => {
    if (contractValidation.status === '' || contractValidation.status === 'error') {
      return true;
    }

    return selectedNftType === '' || selectedChain === '';
  }, [contractValidation, selectedChain, selectedNftType]);

  const searchChain = useCallback((chainInfo: _ChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      chainInfo.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <PageWrapper
      className={className}
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
          loading: loading,
          onClick: onSubmit,
          children: 'Save'
        }}
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderPaddingVertical={true}
        title={t<string>('Import NFT')}
      >
        <div className={'nft_import__container'}>
          <Form
            initialValues={{
              contractAddress: '',
              chain: '',
              collectionName: '',
              type: ''
            }}
            name={'nft-import'}
            ref={formRef}
          >
            <Form.Item
              name='chain'
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
              name='type'
            >
              <SelectModal
                className={className}
                disabled={selectedChain === ''}
                id='import-nft-select-type'
                itemKey={'value'}
                items={nftTypeOptions}
                label={t<string>('NFT type')}
                onSelect={onChangeNftType}
                placeholder={t('Select NFT type')}
                renderItem={renderNftTypeOption}
                renderSelected={renderNftTypeSelected}
                selected={selectedNftType}
              />
            </Form.Item>

            <Form.Item
              name='contractAddress'
              rules={[{ validator: contractAddressValidator }]}
            >
              <Input
                disabled={selectedNftType === ''}
                label={t<string>('NFT contract address')}
                prefix={contractAddressIcon()}
                suffix={contractAddressQrIcon()}
              />
            </Form.Item>

            <Form.Item
              name='collectionName'
              rules={[{ validator: collectionNameValidator }]}
            >
              <Input
                disabled={isCollectionNameDisabled()}
                label={t<string>('NFT collection name')}
              />
            </Form.Item>

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

const NftImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.nft_import__container': {
      marginTop: token.margin,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.nft_import__Qr': {
      cursor: 'pointer'
    },

    '.ant-web3-block-right-item': {
      marginRight: 0
    },

    '.ant-input-suffix': {
      marginRight: 0
    },

    '.nft_import__selected_option': {
      color: token.colorTextHeading
    }
  });
});

export default NftImport;
