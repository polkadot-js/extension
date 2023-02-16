// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetContractSupportedChains from '@subwallet/extension-koni-ui/hooks/screen/nft/useGetContractSupportedChains';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateStatus } from '@subwallet/extension-koni-ui/types/validator';
import { Button, Form, Icon, Input, NetworkItem, SelectModal } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import {CaretRight, CheckCircle, Info} from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

interface NftImportFormType {
  contractAddress: string,
  chain: string,
  collectionName: string
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;

  const formRef = useRef<FormInstance<NftImportFormType>>(null);
  const chainInfoMap = useGetContractSupportedChains();
  const [selected, setSelected] = useState<string>(Object.values(chainInfoMap)[0].slug || '');
  const [contractAddressValidation, setContractAddressValidation] = useState<ValidateStatus | null>(null);
  const [contractValidation, setContractValidation] = useState<ValidateStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const onFinish = useCallback(() => {
    console.log('onFinish');
  }, []);

  const onChangeContractAddress: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    console.log('changing contract', event);
  }, []);

  const onChangeChain = useCallback((value: string) => {
    setSelected(value);
  }, []);

  const onChangeCollectionName: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    console.log('change collection name', event);
  }, []);

  const renderChainOption = useCallback((chainInfo: _ChainInfo, selected: boolean) => {
    return (
      <NetworkItem
        name={chainInfo.name}
        networkMainLogoShape={'circle'}
        networkMainLogoSize={28}
        rightItem={<Icon
          customSize={'20px'}
          iconColor={selected ? token.colorSuccess : token['gray-6']}
          phosphorIcon={selected ? CheckCircle : CaretRight}
          type='phosphor'
          weight={selected ? 'fill' : 'light'}
        />}
        networkKey={chainInfo.slug}
      />
    );
  }, [token.colorSuccess]);

  const renderChainSelected = useCallback((chainInfo: _ChainInfo, selected: boolean) => {
    return (
      <div>
        {chainInfo.name}
      </div>
    );
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
            initialValues={{}}
            name={'nft-import'}
            onFinish={onFinish}
            ref={formRef}
          >
            <Form.Item
              rules={[
                {
                  required: true,
                  message: t('Please input a contract address!')
                }
              ]}
            >
              <Input
                label={t<string>('NFT contract address')}
                onChange={onChangeContractAddress}
              />
            </Form.Item>

            <Form.Item>
              <SelectModal
                id='import-nft-select-chain'
                itemKey={'slug'}
                items={Object.values(chainInfoMap)}
                label={t<string>('Chain')}
                onSelect={onChangeChain}
                renderItem={renderChainOption}
                renderSelected={renderChainSelected}
                selected={selected}
              />
            </Form.Item>

            <Form.Item
              rules={[
                {
                  required: true,
                  message: 'Please set a collection name!'
                }
              ]}
            >
              <Input
                label={t<string>('NFT collection name')}
                onChange={onChangeCollectionName}
              />
            </Form.Item>

            <Form.Item>
              <Button
                block={true}
                disabled={!!contractAddressValidation || !!contractValidation}
                htmlType='submit'
                loading={loading}
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
    }
  });
});

export default NftImport;
