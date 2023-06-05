// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { isAccountAll } from '@subwallet/extension-base/utils';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { ServiceSelector } from '@subwallet/extension-koni-ui/components/Field/BuyTokens/ServiceSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import { PREDEFINED_BUY_TOKEN, PREDEFINED_BUY_TOKEN_BY_SLUG } from '@subwallet/extension-koni-ui/constants';
import { useAssetChecker, useDefaultNavigate, useNotification, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType, CreateBuyOrderFunction, SupportService, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BuyTokensParam } from '@subwallet/extension-koni-ui/types/navigation';
import { createBanxaOrder, createTransakOrder, findAccountByAddress, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { getAccountType } from '@subwallet/extension-koni-ui/utils/account/account';
import reformatAddress from '@subwallet/extension-koni-ui/utils/account/reformatAddress';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/utils/chain/getNetworkJsonByGenesisHash';
import { Button, Form, Icon, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

type BuyTokensFormProps = {
  address: string;
  tokenKey: string;
  service: SupportService;
}

function getTokenItems (accountType: AccountType, ledgerNetwork?: string): TokenItemType[] {
  const result: TokenItemType[] = [];

  Object.values(PREDEFINED_BUY_TOKEN).forEach((info) => {
    if (ledgerNetwork) {
      if (info.network === ledgerNetwork) {
        result.push({
          name: info.symbol,
          slug: info.slug,
          symbol: info.symbol,
          originChain: info.network
        });
      }
    } else {
      if (accountType === 'ALL' || accountType === info.support) {
        result.push({
          name: info.symbol,
          slug: info.slug,
          symbol: info.symbol,
          originChain: info.network
        });
      }
    }
  });

  return result;
}

const tokenKeyMapIsEthereum: Record<string, boolean> = (() => {
  const result: Record<string, boolean> = {};

  Object.values(PREDEFINED_BUY_TOKEN).forEach((info) => {
    result[info.slug] = info.support === 'ETHEREUM';
  });

  return result;
})();

function Component ({ className }: Props) {
  const locationState = useLocation().state as BuyTokensParam;
  const [currentSymbol] = useState<string | undefined>(locationState?.symbol);
  const fixedTokenKey = currentSymbol ? PREDEFINED_BUY_TOKEN[currentSymbol]?.slug : undefined;

  const notify = useNotification();

  const { accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const checkAsset = useAssetChecker();

  const [currentAddress] = useState<string | undefined>(currentAccount?.address);
  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const [form] = Form.useForm<BuyTokensFormProps>();
  const formDefault: BuyTokensFormProps = {
    address: isAllAccount ? '' : (currentAccount?.address || ''),
    tokenKey: fixedTokenKey || '',
    service: '' as SupportService
  };

  const [loading, setLoading] = useState(false);

  const selectedAddress = Form.useWatch('address', form);
  const selectedTokenKey = Form.useWatch('tokenKey', form);
  const selectedService = Form.useWatch('service', form);

  const accountType = selectedAddress ? getAccountType(selectedAddress) : '';
  const ledgerNetwork = useMemo((): string | undefined => {
    const account = findAccountByAddress(accounts, selectedAddress);

    if (account?.originGenesisHash) {
      return findNetworkJsonByGenesisHash(chainInfoMap, account.originGenesisHash)?.slug;
    }

    return undefined;
  }, [accounts, chainInfoMap, selectedAddress]);

  useEffect(() => {
    selectedTokenKey && checkAsset(selectedTokenKey);
  }, [checkAsset, selectedTokenKey]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    if (fixedTokenKey) {
      return getTokenItems('ALL', ledgerNetwork);
    }

    if (!accountType) {
      return [];
    }

    return getTokenItems(accountType, ledgerNetwork);
  }, [accountType, fixedTokenKey, ledgerNetwork]);

  const onClickNext = useCallback(() => {
    setLoading(true);

    const { address, service, tokenKey } = form.getFieldsValue();

    let urlPromise: CreateBuyOrderFunction | undefined;

    const buyInfo = PREDEFINED_BUY_TOKEN_BY_SLUG[tokenKey];
    const { network } = buyInfo;

    const serviceInfo = buyInfo.serviceInfo[service];
    const networkPrefix = chainInfoMap[network].substrateInfo?.addressPrefix;

    const walletAddress = reformatAddress(address, networkPrefix === undefined ? -1 : networkPrefix);

    switch (service) {
      case 'transak':
        urlPromise = createTransakOrder;
        break;
      case 'banxa':
        urlPromise = createBanxaOrder;
        break;
    }

    if (urlPromise && serviceInfo && buyInfo.services.includes(service)) {
      const { network: serviceNetwork, symbol } = serviceInfo;

      urlPromise(symbol, walletAddress, serviceNetwork)
        .then((url) => {
          openInNewTab(url)();
        })
        .catch((e) => {
          console.error(e);
          notify({
            message: t('Create buy order fail')
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [form, chainInfoMap, notify, t]);

  const isSupportBuyTokens = useMemo(() => {
    if (selectedService && selectedAddress && selectedTokenKey) {
      const buyInfo = PREDEFINED_BUY_TOKEN_BY_SLUG[selectedTokenKey];
      const accountType = getAccountType(selectedAddress);

      return buyInfo && buyInfo.support === accountType && buyInfo.services.includes(selectedService) && tokenItems.find((item) => item.slug === selectedTokenKey);
    }

    return false;
  }, [selectedService, selectedAddress, selectedTokenKey, tokenItems]);

  useEffect(() => {
    if (currentAddress !== currentAccount?.address) {
      goBack();
    }
  }, [currentAccount?.address, currentAddress, goBack]);

  useEffect(() => {
    if (!fixedTokenKey && tokenItems.length) {
      const { tokenKey } = form.getFieldsValue();

      if (!tokenKey) {
        form.setFieldsValue({ tokenKey: tokenItems[0].slug });
      } else {
        const isSelectedTokenInList = tokenItems.some((i) => i.slug === tokenKey);

        if (!isSelectedTokenInList) {
          form.setFieldsValue({ tokenKey: tokenItems[0].slug });
        }
      }
    }
  }, [tokenItems, fixedTokenKey, form]);

  const accountsFilter = useCallback((account: AccountJson) => {
    if (isAccountAll(account.address)) {
      return false;
    }

    if (fixedTokenKey) {
      if (tokenKeyMapIsEthereum[fixedTokenKey]) {
        return isEthereumAddress(account.address);
      } else {
        return !isEthereumAddress(account.address);
      }
    }

    return true;
  }, [fixedTokenKey]);

  return (
    <Layout.Home
      showFilterIcon
      showTabBar={false}
    >
      <PageWrapper className={CN(className, 'transaction-wrapper')}>
        <SwSubHeader
          background={'transparent'}
          center
          className={'transaction-header'}
          onBack={goBack}
          paddingVertical
          showBackButton
          title={t('Buy token')}
        />
        <div className={'__scroll-container'}>
          <div className='__buy-icon-wrapper'>
            <Icon
              className={'__buy-icon'}
              phosphorIcon={ShoppingCartSimple}
              weight={'fill'}
            />
          </div>

          <Form
            className='__form-container form-space-sm'
            form={form}
            initialValues={formDefault}
          >
            <Form.Item
              className={CN({
                hidden: !isAllAccount
              })}
              name={'address'}
            >
              <AccountSelector
                disabled={!isAllAccount}
                filter={accountsFilter}
                label={t('Select account')}
              />
            </Form.Item>

            <div className='form-row'>
              <Form.Item name={'tokenKey'}>
                <TokenSelector
                  disabled={!!fixedTokenKey || !tokenItems.length}
                  items={tokenItems}
                  showChainInSelected={false}
                />
              </Form.Item>

              <Form.Item name={'service'}>
                <ServiceSelector
                  placeholder={t('Select supplier')}
                  title={t('Select supplier')}
                />
              </Form.Item>
            </div>
          </Form>

          <div className={'common-text __note'}>
            {t('You will be directed to the chosen supplier to complete this transaction')}
          </div>
        </div>

        <div className={'__layout-footer'}>
          <Button
            disabled={!isSupportBuyTokens}
            icon={ (
              <Icon
                phosphorIcon={ShoppingCartSimple}
                weight={'fill'}
              />
            )}
            loading={loading}
            onClick={onClickNext}
          >
            {t('Buy now')}
          </Button>
        </div>
      </PageWrapper>
    </Layout.Home>
  );
}

const BuyTokens = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    flexDirection: 'column',

    '.__scroll-container': {
      flex: 1,
      overflow: 'auto',
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.__buy-icon-wrapper': {
      position: 'relative',
      width: 112,
      height: 112,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: token.margin,
      marginBottom: token.marginLG,

      '&:before': {
        content: '""',
        backgroundColor: token.colorSuccess,
        inset: 0,
        position: 'absolute',
        display: 'block',
        borderRadius: '100%',
        opacity: '0.1'
      }
    },

    '.__buy-icon': {
      fontSize: 64,
      color: token.colorSuccess
    },

    '.__note': {
      paddingTop: token.paddingXXS,
      paddingBottom: token.padding,
      color: token.colorTextLight5,
      textAlign: 'center'
    },

    '.__layout-footer': {
      display: 'flex',
      padding: token.paddingMD,
      paddingBottom: token.paddingLG,
      gap: token.paddingXS,

      '.ant-btn': {
        flex: 1
      },

      '.full-width': {
        minWidth: '100%'
      }
    }
  });
});

export default BuyTokens;
