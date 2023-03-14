// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { AddressInput } from '@subwallet/extension-koni-ui/components/Field/AddressInput';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { ChainSelector } from '@subwallet/extension-koni-ui/components/Field/ChainSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import { makeCrossChainTransfer, makeTransfer } from '@subwallet/extension-koni-ui/messaging';
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
import { Rule } from '@subwallet/react-ui/es/form';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { PaperPlaneTilt } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

interface TransferFormProps extends TransactionFormBaseProps {
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
  const isAllAccount = useSelector((state: RootState) => state.accountState.isAllAccount);
  const balanceMap = useSelector((state: RootState) => state.balance.balanceMap);
  const transactionContext = useContext(TransactionContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [form] = useForm<TransferFormProps>();
  const formDefault = {
    from: transactionContext.from,
    chain: transactionContext.chain,
    destChain: '',
    token: '',
    to: '',
    value: ''
  };

  const destChainItems = useMemo<ChainItemType[]>(() => {
    return getDestinationChainItems(transactionContext.chain, chainInfoMap);
  }, [chainInfoMap, transactionContext.chain]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    return getTokenItems(
      transactionContext.from,
      chainInfoMap,
      chainStateMap,
      assetRegistryMap,
      assetSettingMap,
      multiChainAssetMap,
      sendFundSlug
    );
  }, [assetRegistryMap, assetSettingMap, chainInfoMap, chainStateMap, transactionContext.from, multiChainAssetMap, sendFundSlug]);

  const validateRecipientAddress = useCallback((rule: Rule, _recipientAddress: string): Promise<void> => {
    if (!_recipientAddress) {
      return Promise.reject(t('Recipient address is required'));
    }

    if (!isAddress(_recipientAddress)) {
      return Promise.reject(t('Invalid Recipient address'));
    }

    const { chain, destChain, from } = form.getFieldsValue();

    const isOnChain = chain === destChain;

    if (isOnChain) {
      if (from === _recipientAddress) {
        // todo: change message later
        return Promise.reject(t('On Chain: The recipient address can not be the same as the sender address'));
      }

      const isNotSameAddressType = (isEthereumAddress(from) && !!_recipientAddress && !isEthereumAddress(_recipientAddress)) ||
        (!isEthereumAddress(from) && !!_recipientAddress && isEthereumAddress(_recipientAddress));

      if (isNotSameAddressType) {
        // todo: change message later
        return Promise.reject(t('On Chain: The recipient address must be same type as the current account address.'));
      }
    } else {
      const isDestChainEvmCompatible = _isChainEvmCompatible(chainInfoMap[destChain]);

      if (isDestChainEvmCompatible !== isEthereumAddress(destChain)) {
        // todo: change message later
        return Promise.reject(t(`Cross chain: The recipient address must be ${isDestChainEvmCompatible ? 'EVM' : 'substrate'} type`));
      }
    }

    return Promise.resolve();
  }, [chainInfoMap, form, t]);

  const validateAmount = useCallback((rule: Rule, amount: string): Promise<void> => {
    if (!amount) {
      return Promise.reject(t('Amount is required'));
    }

    if ((new BigN(amount)).eq(new BigN(0))) {
      return Promise.reject(t('Amount must be greater than 0'));
    }

    return Promise.resolve();
  }, [t]);

  const onFieldsChange = useCallback(
    (part: Partial<TransferFormProps>, values: TransferFormProps) => {
      if (part.from || part.token || part.destChain) {
        form.resetFields(['to']);
      }

      if (part.from) {
        transactionContext.setFrom(part.from);
      }

      if (part.token) {
        form.resetFields(['value']);
        const chain = assetRegistryMap[part.token].originChain;

        form.setFieldsValue({
          chain: chain,
          destChain: chain
        });

        transactionContext.setChain(chain);
      }

      setErrors([]);
    },
    [assetRegistryMap, form, transactionContext]
  );

  // Submit transaction
  const submitTransaction = useCallback(
    () => {
      form.validateFields().then((values) => {
        setLoading(true);
        const { chain, destChain, from, to, token, value } = values;

        let sendPromise: Promise<SWTransactionResponse>;

        if (chain === destChain) {
          // Transfer token or send fund
          sendPromise = makeTransfer({
            from,
            networkKey: chain,
            to: to,
            tokenSlug: token,
            value: value
          });
        } else {
          // Make cross chain transfer
          sendPromise = makeCrossChainTransfer({
            destinationNetworkKey: destChain,
            from,
            originNetworkKey: chain,
            sendingTokenSlug: token,
            to,
            value
          });
        }

        // Handle transfer action
        sendPromise.then((rs) => {
          const { errors, extrinsicHash, warnings } = rs;

          if (errors.length || warnings.length) {
            setLoading(false);
            setErrors(errors.map((e) => e.message));
            setWarnings(warnings.map((w) => w.message));
          } else if (extrinsicHash) {
            transactionContext.onDone(extrinsicHash);
          }
        }).catch((e: Error) => {
          setLoading(false);
          setErrors([e.message]);
        });
      }).catch(console.log);
    },
    [form, transactionContext]
  );

  const currentTokenSlug = Form.useWatch('token', form);
  const currentChainAsset = useMemo(() => {
    return currentTokenSlug ? assetRegistryMap[currentTokenSlug] : undefined;
  }, [assetRegistryMap, currentTokenSlug]);

  const maxTransfer: string = (() => {
    if (currentTokenSlug && balanceMap[currentTokenSlug]) {
      return balanceMap[currentTokenSlug].free || '0';
    }

    return '0';
  })();

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

  return (
    <>
      <TransactionContent className={CN(`${className} -transaction-content`)}>
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

            <Form.Item
              name={'value'}
              rules={[
                {
                  validator: validateAmount
                }
              ]}
              validateTrigger='onBlur'
            >
              <AmountInput
                decimals={currentChainAsset?.decimals || 18}
                maxValue={maxTransfer}
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

          <Form.Item
            name={'to'}
            rules={[
              {
                validator: validateRecipientAddress
              }
            ]}
            validateTrigger='onBlur'
          >
            <AddressInput
              label={t('Send to account')}
              showScanner={true}
            />
          </Form.Item>
        </Form>

        <FreeBalance tokenSlug={currentTokenSlug} />
      </TransactionContent>
      <TransactionFooter
        className={`${className} -transaction-footer`}
        errors={errors}
        warnings={warnings}
      >
        <Button
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
    },

    '&.-transaction-content.-is-zero-balance': {
      '.free-balance .ant-number': {
        '.ant-number-integer, .ant-number-decimal': {
          color: `${token.colorError} !important`
        }
      }
    }
  });
});

export default SendFund;
