// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@subwallet/chain-list/types';
import { isValidSubstrateAddress } from '@subwallet/extension-koni-base/utils';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetContractSupportedChains from '@subwallet/extension-koni-ui/hooks/screen/nft/useGetContractSupportedChains';
import useGetNftTypeSupported, { NftTypeOption } from '@subwallet/extension-koni-ui/hooks/screen/nft/useGetNftTypeSupported';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateStatus } from '@subwallet/extension-koni-ui/types/validator';
import { Button, Form, Icon, Image, Input, NetworkItem, SelectModal } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { CheckCircle, QrCode } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { ChangeEventHandler, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import LogosMap from '../../../assets/logo';

type Props = ThemeProps

interface NftImportFormType {
  contractAddress: string,
  chain: string,
  collectionName: string,
  type: _AssetType
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const [, update] = useState({});

  const formRef = useRef<FormInstance<NftImportFormType>>(null);
  const chainInfoMap = useGetContractSupportedChains();
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [selectedNftType, setSelectedNftType] = useState<string>('');
  const [contractValidation, setContractValidation] = useState<ValidateStatus>('');
  const [loading, setLoading] = useState(false);

  const nftTypeOptions = useGetNftTypeSupported(chainInfoMap[selectedChain]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const onSubmit = useCallback(() => {
    const formValues = formRef.current?.getFieldsValue();

    console.log('onFinish', formValues);
  }, []);

  const onChangeContractAddress: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    update({});
    setContractValidation('');
  }, []);

  const onChangeChain = useCallback((value: string) => {
    formRef.current?.setFieldValue('chain', value);
    setSelectedChain(value);
  }, []);

  const onChangeNftType = useCallback((value: string) => {
    formRef.current?.setFieldValue('type', value as _AssetType);
    setSelectedNftType(value);
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

  const renderNftTypeOption = useCallback((nftType: NftTypeOption, selected: boolean) => {
    return (
      <div>{nftType.label} {selected}</div>
    );
  }, []);

  const renderNftTypeSelected = useCallback((nftType: NftTypeOption) => {
    return (
      <div>{nftType.label}</div>
    );
  }, []);

  const renderChainSelected = useCallback((chainInfo: _ChainInfo) => {
    return (
      <div className={'nft_import__selected_chain'}>{chainInfo.name}</div>
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
      if ([_AssetType.ERC721].includes(selectedNftType as _AssetType) && isEthereumAddress(contractAddress)) {
        resolve();
      }

      if ([_AssetType.PSP34].includes(selectedNftType as _AssetType) && isValidSubstrateAddress(contractAddress)) {
        resolve();
      }

      reject(t('Invalid contract address'));
    });
  }, [selectedNftType, t]);

  const isCollectionNameDisabled = useCallback(() => {

  }, []);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
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
              collectionName: ''
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
                placeholder={t('Choose the origin chain of the NFT')}
                prefix={selectedChain !== '' && originChainLogo()}
                renderItem={renderChainOption}
                renderSelected={renderChainSelected}
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
                placeholder={t('Choose the NFT type')}
                renderItem={renderNftTypeOption}
                renderSelected={renderNftTypeSelected}
                selected={selectedNftType}
              />
            </Form.Item>

            <Form.Item
              name='contractAddress'
              rules={[{ validator: contractAddressValidator }]}
              validateStatus={contractValidation}
            >
              <Input
                disabled={selectedNftType === ''}
                label={t<string>('NFT contract address')}
                onChange={onChangeContractAddress}
                prefix={contractAddressIcon()}
                suffix={contractAddressQrIcon()}
              />
            </Form.Item>

            <Form.Item
              name='collectionName'
              rules={[{ validator: collectionNameValidator }]}
            >
              <Input
                label={t<string>('NFT collection name')}
                disabled={contractValidation === '' || contractValidation === 'error' || }
              />
            </Form.Item>

            <Form.Item>
              <Button
                block={true}
                disabled={!!contractValidation}
                htmlType='submit'
                icon={<Icon
                  customSize={'28px'}
                  iconColor={token.colorTextLight1}
                  phosphorIcon={CheckCircle}
                  type='phosphor'
                  weight={'fill'}
                />}
                loading={loading}
                onClick={onSubmit}
              >
                {t('Save')}
              </Button>
            </Form.Item>
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

    '.nft_import__selected_chain': {
      color: token.colorTextHeading
    }
  });
});

export default NftImport;
