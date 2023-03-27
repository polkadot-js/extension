// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _getOriginChainOfAsset, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { AddressInput } from '@subwallet/extension-koni-ui/components/Field/AddressInput';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { ChainSelector } from '@subwallet/extension-koni-ui/components/Field/ChainSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import { getFreeBalance, makeCrossChainTransfer, makeTransfer } from '@subwallet/extension-koni-ui/messaging';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SendFundParam } from '@subwallet/extension-koni-ui/types/navigation';
import { ChainItemType } from '@subwallet/extension-koni-ui/types/network';
import { findAccountByAddress } from '@subwallet/extension-koni-ui/util';
import { isTokenAvailable } from '@subwallet/extension-koni-ui/util/chain/chainAndAsset';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/util/chain/getNetworkJsonByGenesisHash';
import { Button, Form, Icon, Input } from '@subwallet/react-ui';
import { Rule } from '@subwallet/react-ui/es/form';
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
  isAccountEthereum: boolean
) {
  return _isChainEvmCompatible(chainInfoMap[chainAsset.originChain]) === isAccountEthereum;
}

function getTokenItems (
  address: string,
  accounts: AccountJson[],
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>,
  assetRegistry: Record<string, _ChainAsset>,
  assetSettingMap: Record<string, AssetSetting>,
  multiChainAssetMap: Record<string, _MultiChainAsset>,
  tokenGroupSlug?: string // is ether a token slug or a multiChainAsset slug
): TokenItemType[] {
  const account = findAccountByAddress(accounts, address);

  if (!account) {
    return [];
  }

  const ledgerNetwork = findNetworkJsonByGenesisHash(chainInfoMap, account.originGenesisHash)?.slug;
  const isAccountEthereum = isEthereumAddress(address);
  const isSetTokenSlug = !!tokenGroupSlug && !!assetRegistry[tokenGroupSlug];
  const isSetMultiChainAssetSlug = !!tokenGroupSlug && !!multiChainAssetMap[tokenGroupSlug];

  if (tokenGroupSlug) {
    if (!(isSetTokenSlug || isSetMultiChainAssetSlug)) {
      return [];
    }

    if (isSetTokenSlug) {
      if (isAssetTypeValid(assetRegistry[tokenGroupSlug], chainInfoMap, isAccountEthereum) &&
        isTokenAvailable(assetRegistry[tokenGroupSlug], assetSettingMap, chainStateMap, false, ledgerNetwork)) {
        const { name, originChain, slug, symbol } = assetRegistry[tokenGroupSlug];

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

  Object.values(assetRegistry).forEach((chainAsset) => {
    if (!(isAssetTypeValid(chainAsset, chainInfoMap, isAccountEthereum) &&
      isTokenAvailable(chainAsset, assetSettingMap, chainStateMap, false, ledgerNetwork))) {
      return;
    }

    if (isSetMultiChainAssetSlug) {
      if (chainAsset.multiChainAsset === tokenGroupSlug) {
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

function getTokenAvailableDestinations (tokenSlug: string, xcmRefMap: Record<string, _AssetRef>, chainInfoMap: Record<string, _ChainInfo>): ChainItemType[] {
  if (!tokenSlug) {
    return [];
  }

  const result: ChainItemType[] = [];
  const originChain = chainInfoMap[_getOriginChainOfAsset(tokenSlug)];

  // Firstly, push the originChain of token
  result.push({
    name: originChain.name,
    slug: originChain.slug
  });

  Object.values(xcmRefMap).forEach((xcmRef) => {
    if (xcmRef.srcAsset === tokenSlug) {
      const destinationChain = chainInfoMap[xcmRef.destChain];

      result.push({
        name: destinationChain.name,
        slug: destinationChain.slug
      });
    }
  });

  return result;
}

const _SendFund = ({ className = '' }: Props): React.ReactElement<Props> => {
  const { t } = useTranslation();
  const locationState = useLocation().state as SendFundParam;
  const [sendFundSlug] = useState<string | undefined>(locationState?.slug);
  const notify = useNotification();

  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const { assetRegistry, assetSettingMap, multiChainAssetMap, xcmRefMap } = useSelector((root: RootState) => root.assetRegistry);
  const chainStateMap = useSelector((state: RootState) => state.chainStore.chainStateMap);

  const { accounts, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const [maxTransfer, setMaxTransfer] = useState<string>('0');

  const { chain: contextChain,
    from: contextFrom,
    onDone: contextOnDone,
    setChain: contextSetChain,
    setAsset: contextSetAsset,
    setFrom: contextSetFrom } = useContext(TransactionContext);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [form] = Form.useForm<TransferFormProps>();
  const formDefault = useMemo(() => {
    return {
      from: contextFrom,
      chain: contextChain,
      destChain: '',
      token: '',
      to: '',
      value: ''
    };
  }, [contextChain, contextFrom]);

  const currentFrom = Form.useWatch('from', form);
  const currentTokenSlug = Form.useWatch('token', form);
  const currentAccount = useMemo(() => findAccountByAddress(accounts, currentFrom), [accounts, currentFrom]);

  const destChainItems = useMemo<ChainItemType[]>(() => {
    return getTokenAvailableDestinations(currentTokenSlug, xcmRefMap, chainInfoMap);
  }, [chainInfoMap, currentTokenSlug, xcmRefMap]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    return getTokenItems(
      contextFrom,
      accounts,
      chainInfoMap,
      chainStateMap,
      assetRegistry,
      assetSettingMap,
      multiChainAssetMap,
      sendFundSlug
    );
  }, [accounts, assetRegistry, assetSettingMap, chainInfoMap, chainStateMap, contextFrom, multiChainAssetMap, sendFundSlug]);

  const validateRecipientAddress = useCallback((rule: Rule, _recipientAddress: string): Promise<void> => {
    if (!_recipientAddress) {
      return Promise.reject(t('Recipient address is required'));
    }

    if (!isAddress(_recipientAddress)) {
      return Promise.reject(t('Invalid Recipient address'));
    }

    const { chain, destChain, from, to } = form.getFieldsValue();

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

      if (isDestChainEvmCompatible !== isEthereumAddress(to)) {
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
        contextSetFrom(part.from);
      }

      if (part.token) {
        form.resetFields(['value']);
        const chain = assetRegistry[part.token].originChain;

        form.setFieldsValue({
          chain: chain,
          destChain: chain
        });

        contextSetChain(chain);
        contextSetAsset(part.token);
      }

      setErrors([]);
    },
    [assetRegistry, form, contextSetChain, contextSetFrom]
  );

  // Submit transaction
  const submitTransaction = useCallback(
    () => {
      if (currentAccount && currentAccount.isReadOnly) {
        notify({
          message: t('The account you are using is read-only, you cannot send assets with it'),
          type: 'info',
          duration: 3
        });

        return;
      }

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
            contextOnDone(extrinsicHash);
          }
        }).catch((e: Error) => {
          setLoading(false);
          setErrors([e.message]);
        });
      }).catch(console.log);
    },
    [currentAccount, form, notify, t, contextOnDone]
  );

  const currentChainAsset = useMemo(() => {
    return currentTokenSlug ? assetRegistry[currentTokenSlug] : undefined;
  }, [assetRegistry, currentTokenSlug]);

  useEffect(() => {
    const { from, token } = form.getFieldsValue();

    if (tokenItems.length) {
      if (!token) {
        const account = findAccountByAddress(accounts, from);

        let pass = false;

        if (account?.originGenesisHash) {
          const network = findNetworkJsonByGenesisHash(chainInfoMap, account.originGenesisHash);

          if (network) {
            const token = tokenItems.find((item) => item.originChain === network.slug);

            if (token) {
              form.setFieldsValue({
                token: token.slug,
                chain: assetRegistry[token.slug].originChain,
                destChain: assetRegistry[token.slug].originChain
              });
              contextSetChain(assetRegistry[token.slug].originChain);
              pass = true;
            }
          }
        }

        if (!pass) {
          form.setFieldsValue({
            token: tokenItems[0].slug,
            chain: assetRegistry[tokenItems[0].slug].originChain,
            destChain: assetRegistry[tokenItems[0].slug].originChain
          });
          contextSetChain(assetRegistry[tokenItems[0].slug].originChain);
        }
      } else {
        const isSelectedTokenInList = tokenItems.some((i) => i.slug === token);

        if (!isSelectedTokenInList) {
          form.setFieldsValue({
            token: tokenItems[0].slug,
            chain: assetRegistry[tokenItems[0].slug].originChain,
            destChain: assetRegistry[tokenItems[0].slug].originChain
          });
          contextSetChain(assetRegistry[tokenItems[0].slug].originChain);
        }
      }
    }
  }, [accounts, tokenItems, assetRegistry, form, contextSetChain, chainInfoMap]);

  useEffect(() => {
    let cancel = false;

    if (currentFrom && currentTokenSlug) {
      getFreeBalance({
        address: currentFrom,
        networkKey: assetRegistry[currentTokenSlug].originChain,
        token: currentTokenSlug
      })
        .then((balance) => {
          !cancel && setMaxTransfer(balance.value);
        })
        .catch(console.error);
    }

    return () => {
      cancel = true;
    };
  }, [currentFrom, assetRegistry, currentTokenSlug]);

  // Focus the first field
  // useEffect(() => {
  //   const focusField = isAllAccount ? 'from' : 'token';
  //
  //   (form.getFieldInstance(focusField) as HTMLInputElement).focus();
  // }, [form, isAllAccount]);

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
                placeholder={t('Select token')}
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
              autoReformatValue
              label={t('Send to account')}
              showScanner={true}
            />
          </Form.Item>

          <Form.Item name={'destChain'}>
            <ChainSelector
              disabled={!destChainItems.length}
              items={destChainItems}
            />
          </Form.Item>
        </Form>

        <FreeBalance
          address={contextFrom}
          chain={contextChain}
          tokenSlug={currentTokenSlug}
        />
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
