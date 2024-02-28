// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { AccountSelector, AddressInput, HiddenInput, PageWrapper, SwapFromField, SwapToField, TokenItemType } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useSelector, useTransactionContext, useWatchTransaction } from '@subwallet/extension-web-ui/hooks';
import { FreeBalance, TransactionContent, TransactionFooter } from '@subwallet/extension-web-ui/Popup/Transaction/parts';
import { FormCallbacks, SwapParams, ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Button, Form, Icon } from '@subwallet/react-ui';
import { Rule } from '@subwallet/react-ui/es/form';
import CN from 'classnames';
import { ArrowsDownUp, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

const hideFields: Array<keyof SwapParams> = ['fromAmount', 'fromTokenSlug', 'toTokenSlug'];

const fakeTokenItems: TokenItemType[] = [
  {
    name: 'Polkadot',
    slug: 'polkadot-NATIVE-DOT',
    symbol: 'DOT',
    originChain: 'polkadot'
  },
  {
    name: 'Kusama',
    slug: 'kusama-NATIVE-KSM',
    symbol: 'KSM',
    originChain: 'kusama'
  },
  {
    name: 'Aleph Zero',
    slug: 'aleph-NATIVE-AZERO',
    symbol: 'AZERO',
    originChain: 'aleph'
  }
];

const Component = () => {
  const { t } = useTranslation();
  const { defaultData, setCustomScreenTitle } = useTransactionContext<SwapParams>();
  const { isWebUI } = useContext(ScreenContext);

  const { isAllAccount } = useSelector((state) => state.accountState);
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);
  // @ts-ignore
  const swapPairs = useSelector((state) => state.swap.swapPairs);

  const [form] = Form.useForm<SwapParams>();
  const formDefault = useMemo((): SwapParams => ({ ...defaultData }), [defaultData]);

  const fromValue = useWatchTransaction('from', form, defaultData);
  const fromTokenSlugValue = useWatchTransaction('fromTokenSlug', form, defaultData);
  const toTokenSlugValue = useWatchTransaction('toTokenSlug', form, defaultData);

  const fromAndToTokenMap = useMemo<Record<string, string[]>>(() => {
    return {};
  }, []);

  const fromTokenItems = useMemo<TokenSelectorItemType[]>(() => {
    return [];
  }, []);

  const toTokenItems = useMemo<TokenSelectorItemType[]>(() => {
    return [];
  }, []);

  const isSwitchable = useMemo(() => {
    return fromAndToTokenMap[toTokenSlugValue];
  }, [fromAndToTokenMap, toTokenSlugValue]);

  // todo: fill later
  const destChain = '';
  const destChainNetworkPrefix = 42;
  const destChainGenesisHash = '';

  const fromDecimals = useMemo(() => {
    const fromAsset = assetRegistryMap[fromTokenSlugValue];

    return fromAsset ? _getAssetDecimals(fromAsset) : 0;
  }, [assetRegistryMap, fromTokenSlugValue]);

  const toDecimals = useMemo(() => {
    const toAsset = assetRegistryMap[fromTokenSlugValue];

    return toAsset ? _getAssetDecimals(toAsset) : 0;
  }, [assetRegistryMap, fromTokenSlugValue]);

  const recipientAddressValidator = useCallback((rule: Rule, _recipientAddress: string): Promise<void> => {
    if (!_recipientAddress) {
      return Promise.reject(t('Recipient address is required'));
    }

    if (!isAddress(_recipientAddress)) {
      return Promise.reject(t('Invalid recipient address'));
    }

    return Promise.resolve();
  }, [t]);

  const onSelectFromToken = useCallback((tokenSlug: string) => {
    form.setFieldValue('fromTokenSlug', tokenSlug);
  }, [form]);

  const onSelectToToken = useCallback((tokenSlug: string) => {
    form.setFieldValue('toTokenSlug', tokenSlug);
  }, [form]);

  const onSubmit: FormCallbacks<SwapParams>['onFinish'] = useCallback((values: SwapParams) => {
    //
  }, []);

  useEffect(() => {
    setCustomScreenTitle(t('Swap'));

    return () => {
      setCustomScreenTitle(undefined);
    };
  }, [setCustomScreenTitle, t]);

  return (
    <>
      <>
        <div className={'__transaction-form-block'}>
          <TransactionContent>
            <Form
              className={'form-container form-space-sm'}
              form={form}
              initialValues={formDefault}
              onFinish={onSubmit}
            >
              <HiddenInput fields={hideFields} />

              <Form.Item
                name={'from'}
              >
                <AccountSelector
                  disabled={!isAllAccount}
                  label={t('Swap from account')}
                />
              </Form.Item>

              <div className={'__balance-display-area'}>
                <FreeBalance
                  address={fromValue}
                  chain={''}
                  isSubscribe={true}
                  label={`${t('Available balance')}:`}
                  tokenSlug={fromTokenSlugValue}
                />
              </div>

              <div className={'__swap-field-area'}>
                <SwapFromField
                  decimals={fromDecimals}
                  label={t('From')}
                  onSelectToken={onSelectFromToken}
                  tokenSelectorItems={fakeTokenItems || fromTokenItems}
                  tokenSelectorValue={fromTokenSlugValue}
                />

                <div className='__switch-side-button'>
                  <Button
                    disabled={!isSwitchable}
                    icon={(
                      <Icon
                        customSize={'20px'}
                        phosphorIcon={ArrowsDownUp}
                        weight='fill'
                      />
                    )}
                    shape='circle'
                    size='xs'
                  >
                  </Button>
                </div>

                <SwapToField
                  decimals={toDecimals}
                  onSelectToken={onSelectToToken}
                  tokenSelectorItems={toTokenItems}
                />
              </div>

              <Form.Item
                name={'recipient'}
                rules={[
                  {
                    validator: recipientAddressValidator
                  }
                ]}
                statusHelpAsTooltip={isWebUI}
                validateTrigger='onBlur'
              >
                <AddressInput
                  addressPrefix={destChainNetworkPrefix}
                  allowDomain={true}
                  chain={destChain}
                  label={t('Recipient account')}
                  networkGenesisHash={destChainGenesisHash}
                  placeholder={t('Input your recipient account')}
                  saveAddress={true}
                  showAddressBook={true}
                  showScanner={true}
                />
              </Form.Item>
            </Form>
          </TransactionContent>
          <TransactionFooter>
            <Button
              block={true}
              className={'__start-earning-button'}
              icon={(
                <Icon
                  phosphorIcon={PlusCircle}
                  weight={'fill'}
                />
              )}
              onClick={form.submit}
            >
              {t('Swap')}
            </Button>
          </TransactionFooter>
        </div>

        {isWebUI && (
          <div className={'__transaction-meta-block'}>

          </div>
        )}
      </>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['swap'])}
    >
      <Component />
    </PageWrapper>
  );
};

const Swap = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 24,
    maxWidth: 784,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: token.size,

    '.web-ui-enable &': {
      '.__transaction-form-block': {
        flex: '1'
      },

      '.__transaction-meta-block': {
        flex: '1'
      }
    }
  };
});

export default Swap;
