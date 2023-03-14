// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { isAccountAll } from '@subwallet/extension-base/utils';
import { Layout } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { ServiceSelector } from '@subwallet/extension-koni-ui/components/Field/BuyTokens/ServiceSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { PREDEFINED_TRANSAK_TOKEN } from '@subwallet/extension-koni-ui/constants/transak';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BuyTokensParam } from '@subwallet/extension-koni-ui/types/navigation';
import { openInNewTab } from '@subwallet/extension-koni-ui/util';
import { getAccountType } from '@subwallet/extension-koni-ui/util/account';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import { Button, Form, Icon, SwSubHeader } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import CN from 'classnames';
import { ShoppingCartSimple } from 'phosphor-react';
import qs from 'querystring';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

type BuyTokensFormProps = {
  address: string,
  tokenKey: string,
  service: 'transak' | 'moonPay' | 'onramper'
}

function getTokenItems (accountType: AccountType): TokenItemType[] {
  const result: TokenItemType[] = [];

  Object.values(PREDEFINED_TRANSAK_TOKEN).forEach((info) => {
    if (accountType === 'ALL' || accountType === info.support) {
      result.push({
        name: info.symbol,
        slug: info.key,
        symbol: info.symbol,
        originChain: info.chain
      });
    }
  });

  return result;
}

const tokenKeyMapIsEthereum: Record<string, boolean> = (() => {
  const result: Record<string, boolean> = {};

  Object.values(PREDEFINED_TRANSAK_TOKEN).forEach((info) => {
    result[info.key] = info.support === 'ETHEREUM';
  });

  return result;
})();

const TransakUrl = 'https://global.transak.com';

function Component ({ className }: Props) {
  const locationState = useLocation().state as BuyTokensParam;
  const [currentSymbol] = useState<string | undefined>(locationState?.symbol);
  const fixedTokenKey = currentSymbol ? PREDEFINED_TRANSAK_TOKEN[currentSymbol]?.key : undefined;
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const [currentAddress] = useState<string | undefined>(currentAccount?.address);
  const isAllAccount = useSelector((state: RootState) => state.accountState.isAllAccount);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const [form] = useForm<BuyTokensFormProps>();
  const formDefault: BuyTokensFormProps = {
    address: isAllAccount ? '' : (currentAccount?.address || ''),
    tokenKey: fixedTokenKey || '',
    service: 'transak'
  };

  const selectedAddress = Form.useWatch('address', form);
  const selectedTokenKey = Form.useWatch('tokenKey', form);
  const selectedService = Form.useWatch('service', form);

  const accountType = selectedAddress ? getAccountType(selectedAddress) : '';

  const tokenItems = useMemo<TokenItemType[]>(() => {
    if (fixedTokenKey) {
      return getTokenItems('ALL');
    }

    if (!accountType) {
      return [];
    }

    return getTokenItems(accountType);
  }, [accountType, fixedTokenKey]);

  const onClickNext = useCallback(() => {
    const { address, service, tokenKey } = form.getFieldsValue();

    if (service === 'transak') {
      const [token, chain, transaKNetwork] = tokenKey.split('|');
      const networkPrefix = chainInfoMap[chain].substrateInfo?.addressPrefix;

      const walletAddress = tokenKeyMapIsEthereum[tokenKey]
        ? address
        : reformatAddress(address, networkPrefix === undefined ? -1 : networkPrefix);

      const params = {
        apiKey: '4b3bfb00-7f7c-44b3-844f-d4504f1065be',
        defaultCryptoCurrency: token,
        networks: transaKNetwork,
        cryptoCurrencyList: token,
        walletAddress
      };

      const query = qs.stringify(params);

      openInNewTab(`${TransakUrl}?${query}`)();
    }
  }, [form, chainInfoMap]);

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
    <Layout.Home showTabBar={false}>
      <PageWrapper className={CN(className, 'transaction-wrapper')}>
        <SwSubHeader
          background={'transparent'}
          center
          className={'transaction-header'}
          onBack={goBack}
          paddingVertical
          showBackButton
          title={t('Buy tokens')}
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
                <ServiceSelector />
              </Form.Item>
            </div>
          </Form>

          <div className={'common-text __note'}>
            {t('You will be taken to independent provider to complete this transaction')}
          </div>
        </div>

        <div className={'__layout-footer'}>
          <Button
            disabled={(selectedService !== 'transak') || !(selectedAddress && selectedTokenKey)}
            icon={ (
              <Icon
                phosphorIcon={ShoppingCartSimple}
                weight={'fill'}
              />
            )}
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
