// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { AddressInput } from '@subwallet/extension-koni-ui/components/Field/AddressInput';
import { ChainSelector } from '@subwallet/extension-koni-ui/components/Field/ChainSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { checkTransfer, makeTransfer } from '@subwallet/extension-koni-ui/messaging';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SendFundParam } from '@subwallet/extension-koni-ui/types/navigation';
import { ChainItemType } from '@subwallet/extension-koni-ui/types/network';
import { isAvailableTokenAsset } from '@subwallet/extension-koni-ui/util/chainAndAsset';
import { Button, Form, Icon, Input } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import CN from 'classnames';
import { PaperPlaneTilt } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface TransferFromProps extends TransactionFormBaseProps {
  to: string
  chain: string
  destChain: string
  token: string
  value: string
}

type Props = ThemeProps;

function isAssetTypeValid (
  chainAsset: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>,
  isEthereum: boolean
) {
  return _isChainEvmCompatible(chainInfoMap[chainAsset.originChain]) === isEthereum;
}

function getTokenItems (
  address: string,
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>,
  assetRegistryMap: Record<string, _ChainAsset>,
  assetSettingMap: Record<string, AssetSetting>,
  multiChainAssetMap: Record<string, _MultiChainAsset>,
  sendFundSlug?: string // is ether a token slug or a multiChainAsset slug
): TokenItemType[] {
  if (!address) {
    return [];
  }

  const isEthereum = isEthereumAddress(address);
  const isSetTokenSlug = !!sendFundSlug && !!assetRegistryMap[sendFundSlug];
  const isSetMultiChainAssetSlug = !!sendFundSlug && !!multiChainAssetMap[sendFundSlug];

  if (sendFundSlug) {
    if (!(isSetTokenSlug || isSetMultiChainAssetSlug)) {
      return [];
    }

    if (isSetTokenSlug) {
      if (isAssetTypeValid(assetRegistryMap[sendFundSlug], chainInfoMap, isEthereum) &&
        isAvailableTokenAsset(assetRegistryMap[sendFundSlug], assetSettingMap, chainStateMap)) {
        const { name, originChain, slug, symbol } = assetRegistryMap[sendFundSlug];

        return [
          {
            name,
            slug,
            symbol,
            originChain
          }
        ];
      } else {
        return [];
      }
    }
  }

  const items: TokenItemType[] = [];

  Object.values(assetRegistryMap).forEach((chainAsset) => {
    if (!(isAssetTypeValid(chainAsset, chainInfoMap, isEthereum) &&
      isAvailableTokenAsset(chainAsset, assetSettingMap, chainStateMap))) {
      return;
    }

    if (isSetMultiChainAssetSlug) {
      if (chainAsset.multiChainAsset === sendFundSlug) {
        items.push({
          name: chainAsset.name,
          slug: chainAsset.slug,
          symbol: chainAsset.symbol,
          originChain: chainAsset.originChain
        });
      }
    } else {
      items.push({
        name: chainAsset.name,
        slug: chainAsset.slug,
        symbol: chainAsset.symbol,
        originChain: chainAsset.originChain
      });
    }
  });

  return items;
}

// todo: will remove this if nampc update the xchain logic
const xChainMap: Record<string, string[]> = {
  polkadot: ['moonbeam', 'astar', 'acala', 'statemint'],
  kusama: ['moonriver', 'shiden', 'karura', 'bifrost'],
  statemint: ['moonbeam', 'astar', 'astarEvm', 'polkadot'],
  acala: ['moonbeam', 'astar', 'astarEvm', 'polkadot'],
  karura: ['moonriver', 'shiden', 'shidenEvm', 'kusama', 'bifrost', 'pioneer'],
  moonbeam: ['acala', 'interlay', 'polkadot'],
  moonriver: ['karura', 'kintsugi', 'kusama', 'bifrost'],
  astar: ['acala', 'polkadot'],
  shiden: ['karura', 'kusama'],
  interlay: ['moonbeam'],
  kintsugi: ['moonriver'],
  bifrost: ['moonriver', 'karura', 'kusama'],
  pioneer: ['karura']
};

function getDestinationChainItems (originChain: string, chainInfoMap: Record<string, _ChainInfo>): ChainItemType[] {
  if (!originChain) {
    return [];
  }

  const result: ChainItemType[] = [
    {
      name: chainInfoMap[originChain].name,
      slug: originChain
    }
  ];

  if (!xChainMap[originChain]) {
    return result;
  }

  xChainMap[originChain].forEach((destChain) => {
    if (chainInfoMap[destChain]) {
      result.push({
        name: chainInfoMap[destChain].name,
        slug: destChain
      });
    }
  });

  return result;
}

const _SendFund = ({ className = '' }: Props): React.ReactElement<Props> => {
  const { t } = useTranslation();
  const locationState = useLocation().state as SendFundParam;
  const [sendFundSlug] = useState<string | undefined>(locationState?.slug);
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const assetSettingMap = useSelector((state: RootState) => state.assetRegistry.assetSettingMap);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);
  const chainStateMap = useSelector((state: RootState) => state.chainStore.chainStateMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const isAllAccount = useSelector((state: RootState) => state.accountState.isAllAccount);
  const [currentAddress] = useState<string | undefined>(currentAccount?.address);
  const { goBack } = useDefaultNavigate();
  const transactionContext = useContext(TransactionContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form] = useForm<TransferFromProps>();
  const formDefault = {
    from: transactionContext.from,
    chain: transactionContext.chain,
    destChain: '',
    token: '',
    to: '',
    value: '0'
  };

  console.log('errors', errors);

  // note: any value below may be undefined
  const fromAddress = Form.useWatch('from', form);
  const toAddress = Form.useWatch('to', form);
  const originChain = Form.useWatch('chain', form);

  // todo
  // if on chain: from =/= to
  // if x chain: from same origin, to same dest

  const destChainItems = useMemo<ChainItemType[]>(() => {
    return getDestinationChainItems(originChain, chainInfoMap);
  }, [chainInfoMap, originChain]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    return getTokenItems(
      fromAddress,
      chainInfoMap,
      chainStateMap,
      assetRegistryMap,
      assetSettingMap,
      multiChainAssetMap,
      sendFundSlug
    );
  }, [assetRegistryMap, assetSettingMap, chainInfoMap, chainStateMap, fromAddress, multiChainAssetMap, sendFundSlug]);

  const onFieldsChange = useCallback(
    (part: Partial<TransferFromProps>, values: TransferFromProps) => {
      if (part.from) {
        transactionContext.setFrom(part.from);
      }

      if (part.chain) {
        transactionContext.setChain(part.chain);
      }

      if (part.token) {
        const chain = assetRegistryMap[part.token].originChain;

        form.setFieldsValue({
          chain: chain,
          destChain: chain
        });

        transactionContext.setChain(chain);
      }

      const { chain,
        destChain,
        from,
        to } = values;

      const isOnChain = chain === destChain;

      const _errors: string[] = [];

      if (isOnChain) {
        if (from === to) {
          _errors.push(t('The recipient address can not be the same as the sender address'));
        }

        const isNotSameAddressType = (isEthereumAddress(from) && !!to && !isEthereumAddress(to)) ||
          (!isEthereumAddress(from) && !!to && isEthereumAddress(to));

        if (isNotSameAddressType) {
          _errors.push(t<string>('The recipient address must be same type as the current account address.'));
        }
      } else {
        const isDestChainEvmCompatible = _isChainEvmCompatible(chainInfoMap[destChain]);

        if (isDestChainEvmCompatible !== isEthereumAddress(destChain)) {
          _errors.push(
            t<string>(`The recipient address must be ${isDestChainEvmCompatible ? 'EVM' : 'substrate'} type`)
          );
        }
      }

      if (_errors.length) {
        setErrors(_errors);
      } else {
        setErrors([]);
      }
    },
    [assetRegistryMap, chainInfoMap, form, t, transactionContext]
  );

  const submitTransaction = useCallback(
    () => {
      setLoading(true);
      const { chain, from, to, token, value } = form.getFieldsValue();

      checkTransfer({
        from,
        networkKey: chain,
        to: to,
        tokenSlug: token,
        value: value
      }).then((rs) => {
        const { errors } = rs;

        if (errors?.length) {
          console.log('errors1', errors);
          setLoading(false);
          setErrors(errors.map((e) => e.message));
        } else {
          makeTransfer({
            from,
            networkKey: chain,
            to: to,
            tokenSlug: token,
            value: value
          }).then(({ errors, extrinsicHash }) => {
            setLoading(false);

            if (errors?.length) {
              setErrors(errors.map((e) => e.message));
            } else if (extrinsicHash) {
              transactionContext.onDone(extrinsicHash);
            }
          }).catch(console.error);
        }
      }).catch((e: Error) => {
        setLoading(false);
        setErrors([e.message]);
      });
    },
    [form, transactionContext]
  );

  useEffect(() => {
    if (currentAddress !== currentAccount?.address) {
      goBack();
    }
  }, [currentAccount?.address, currentAddress, goBack]);

  useEffect(() => {
    if (tokenItems.length) {
      const { token } = form.getFieldsValue();

      if (!token) {
        form.setFieldsValue({
          token: tokenItems[0].slug,
          chain: assetRegistryMap[tokenItems[0].slug].originChain,
          destChain: assetRegistryMap[tokenItems[0].slug].originChain
        });
        transactionContext.setChain(assetRegistryMap[tokenItems[0].slug].originChain);
      } else {
        const isSelectedTokenInList = tokenItems.some((i) => i.slug === token);

        if (!isSelectedTokenInList) {
          form.setFieldsValue({
            token: tokenItems[0].slug,
            chain: assetRegistryMap[tokenItems[0].slug].originChain,
            destChain: assetRegistryMap[tokenItems[0].slug].originChain
          });
          transactionContext.setChain(assetRegistryMap[tokenItems[0].slug].originChain);
        }
      }
    }
  }, [tokenItems, assetRegistryMap, form, transactionContext]);

  const isAllowToSubmit = !errors.length && fromAddress && toAddress && originChain;

  return (
    <>
      <TransactionContent className={`${className} -transaction-content`}>
        <div className={'__brief common-text text-light-4 text-center'}>
          {t('You are doing a token transfer with the following information')}
        </div>

        <Form
          className={'form-container form-space-sm'}
          form={form}
          initialValues={formDefault}
          onValuesChange={onFieldsChange}
        >
          <Form.Item
            className={CN({ hidden: !isAllAccount })}
            name={'from'}
          >
            <AccountSelector
              disabled={!isAllAccount}
              label={t('Send from account')}
            />
          </Form.Item>

          <div className={'form-row'}>
            <Form.Item name={'token'}>
              <TokenSelector
                disabled={!tokenItems.length}
                items={tokenItems}
                showChainInSelected
              />
            </Form.Item>

            <Form.Item name={'value'}>
              <Input
                placeholder={t('value')}
              />
            </Form.Item>
          </div>

          <Form.Item
            className={'hidden'}
            name={'chain'}
          >
            <Input
              placeholder={t('value')}
            />
          </Form.Item>

          <Form.Item name={'destChain'}>
            <ChainSelector
              disabled={!destChainItems.length}
              items={destChainItems}
            />
          </Form.Item>

          <Form.Item name={'to'}>
            <AddressInput label={t('Send to account')} />
          </Form.Item>
        </Form>

        <FreeBalance />
      </TransactionContent>
      <TransactionFooter
        className={`${className} -transaction-footer`}
        errors={errors}
      >
        <Button
          disabled={!isAllowToSubmit}
          icon={(
            <Icon
              phosphorIcon={PaperPlaneTilt}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={submitTransaction}
        >
          {t('Transfer')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const SendFund = styled(_SendFund)(({ theme }) => {
  const token = (theme as Theme).token;

  return ({
    '.__brief': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      marginBottom: token.marginLG
    }
  });
});

export default SendFund;
