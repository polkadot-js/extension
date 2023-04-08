// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from "@subwallet/extension-base/background/types";
import { isAccountAll } from "@subwallet/extension-base/utils";
import { Layout, PageWrapper } from "@subwallet-webapp/components";
import { AccountSelector } from "@subwallet-webapp/components/Field/AccountSelector";
import { ServiceSelector } from "@subwallet-webapp/components/Field/BuyTokens/ServiceSelector";
import {
  TokenItemType,
  TokenSelector,
} from "@subwallet-webapp/components/Field/TokenSelector";
import { PREDEFINED_TRANSAK_TOKEN } from "@subwallet-webapp/constants/transak";
import useAssetChecker from "@subwallet-webapp/hooks/chain/useAssetChecker";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { RootState } from "@subwallet-webapp/stores";
import { AccountType, ThemeProps } from "@subwallet-webapp/types";
import { BuyTokensParam } from "@subwallet-webapp/types/navigation";
import { findAccountByAddress, openInNewTab } from "@subwallet-webapp/util";
import { getAccountType } from "@subwallet-webapp/util/account/account";
import reformatAddress from "@subwallet-webapp/util/account/reformatAddress";
import { findNetworkJsonByGenesisHash } from "@subwallet-webapp/util/chain/getNetworkJsonByGenesisHash";
import { Button, Form, Icon, SwSubHeader } from "@subwallet/react-ui";
import CN from "classnames";
import { ShoppingCartSimple } from "phosphor-react";
import qs from "querystring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

type Props = ThemeProps;

type BuyTokensFormProps = {
  address: string;
  tokenKey: string;
  service: "transak" | "moonPay" | "onramper";
};

function getTokenItems(
  accountType: AccountType,
  ledgerNetwork?: string
): TokenItemType[] {
  const result: TokenItemType[] = [];

  Object.values(PREDEFINED_TRANSAK_TOKEN).forEach((info) => {
    if (ledgerNetwork) {
      if (info.chain === ledgerNetwork) {
        result.push({
          name: info.symbol,
          slug: info.slug,
          symbol: info.symbol,
          originChain: info.chain,
        });
      }
    } else {
      if (accountType === "ALL" || accountType === info.support) {
        result.push({
          name: info.symbol,
          slug: info.slug,
          symbol: info.symbol,
          originChain: info.chain,
        });
      }
    }
  });

  return result;
}

const tokenKeyMapIsEthereum: Record<string, boolean> = (() => {
  const result: Record<string, boolean> = {};

  Object.values(PREDEFINED_TRANSAK_TOKEN).forEach((info) => {
    result[info.slug] = info.support === "ETHEREUM";
  });

  return result;
})();

const TransakUrl = "https://global.transak.com";

function Component({ className }: Props) {
  const locationState = useLocation().state as BuyTokensParam;
  const [currentSymbol] = useState<string | undefined>(locationState?.symbol);
  const fixedTokenKey = currentSymbol
    ? PREDEFINED_TRANSAK_TOKEN[currentSymbol]?.slug
    : undefined;

  const { accounts, currentAccount, isAllAccount } = useSelector(
    (state: RootState) => state.accountState
  );
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const checkAsset = useAssetChecker();

  const [currentAddress] = useState<string | undefined>(
    currentAccount?.address
  );
  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const [form] = Form.useForm<BuyTokensFormProps>();
  const formDefault: BuyTokensFormProps = {
    address: isAllAccount ? "" : currentAccount?.address || "",
    tokenKey: fixedTokenKey || "",
    service: "transak",
  };

  const selectedAddress = Form.useWatch("address", form);
  const selectedTokenKey = Form.useWatch("tokenKey", form);
  const selectedService = Form.useWatch("service", form);

  const accountType = selectedAddress ? getAccountType(selectedAddress) : "";
  const ledgerNetwork = useMemo((): string | undefined => {
    const account = findAccountByAddress(accounts, selectedAddress);

    if (account?.originGenesisHash) {
      return findNetworkJsonByGenesisHash(
        chainInfoMap,
        account.originGenesisHash
      )?.slug;
    }

    return undefined;
  }, [accounts, chainInfoMap, selectedAddress]);

  useEffect(() => {
    selectedTokenKey && checkAsset(selectedTokenKey);
  }, [checkAsset, selectedTokenKey]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    if (fixedTokenKey) {
      return getTokenItems("ALL", ledgerNetwork);
    }

    if (!accountType) {
      return [];
    }

    return getTokenItems(accountType, ledgerNetwork);
  }, [accountType, fixedTokenKey, ledgerNetwork]);

  const onClickNext = useCallback(() => {
    const { address, service, tokenKey } = form.getFieldsValue();

    if (service === "transak") {
      console.debug(PREDEFINED_TRANSAK_TOKEN, selectedTokenKey);
      const { chain, symbol, transakNetwork } =
        PREDEFINED_TRANSAK_TOKEN[selectedTokenKey];
      const networkPrefix = chainInfoMap[chain].substrateInfo?.addressPrefix;

      const walletAddress = tokenKeyMapIsEthereum[tokenKey]
        ? address
        : reformatAddress(
            address,
            networkPrefix === undefined ? -1 : networkPrefix
          );

      const params = {
        apiKey: "4b3bfb00-7f7c-44b3-844f-d4504f1065be",
        defaultCryptoCurrency: symbol,
        networks: transakNetwork,
        cryptoCurrencyList: symbol,
        walletAddress,
      };

      const query = qs.stringify(params);

      openInNewTab(`${TransakUrl}?${query}`)();
    }
  }, [form, selectedTokenKey, chainInfoMap]);

  const isSupportBuyTokens = useMemo(() => {
    if (selectedService === "transak" && selectedAddress && selectedTokenKey) {
      const transakInfo = PREDEFINED_TRANSAK_TOKEN[selectedTokenKey];
      const accountType = getAccountType(selectedAddress);

      return (
        transakInfo &&
        transakInfo.support === accountType &&
        tokenItems.find((item) => item.slug === selectedTokenKey)
      );
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
        const isSelectedTokenInList = tokenItems.some(
          (i) => i.slug === tokenKey
        );

        if (!isSelectedTokenInList) {
          form.setFieldsValue({ tokenKey: tokenItems[0].slug });
        }
      }
    }
  }, [tokenItems, fixedTokenKey, form]);

  const accountsFilter = useCallback(
    (account: AccountJson) => {
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
    },
    [fixedTokenKey]
  );

  return (
    <Layout.Home showFilterIcon showTabBar={false}>
      <PageWrapper className={CN(className, "transaction-wrapper")}>
        <SwSubHeader
          background={"transparent"}
          center
          className={"transaction-header"}
          onBack={goBack}
          paddingVertical
          showBackButton
          title={t("Buy tokens")}
        />
        <div className={"__scroll-container"}>
          <div className="__buy-icon-wrapper">
            <Icon
              className={"__buy-icon"}
              phosphorIcon={ShoppingCartSimple}
              weight={"fill"}
            />
          </div>

          <Form
            className="__form-container form-space-sm"
            form={form}
            initialValues={formDefault}
          >
            <Form.Item
              className={CN({
                hidden: !isAllAccount,
              })}
              name={"address"}
            >
              <AccountSelector
                disabled={!isAllAccount}
                filter={accountsFilter}
                label={t("Select account")}
              />
            </Form.Item>

            <div className="form-row">
              <Form.Item name={"tokenKey"}>
                <TokenSelector
                  disabled={!!fixedTokenKey || !tokenItems.length}
                  items={tokenItems}
                  showChainInSelected={false}
                />
              </Form.Item>

              <Form.Item name={"service"}>
                <ServiceSelector />
              </Form.Item>
            </div>
          </Form>

          <div className={"common-text __note"}>
            {t(
              "You will be taken to independent provider to complete this transaction"
            )}
          </div>
        </div>

        <div className={"__layout-footer"}>
          <Button
            disabled={!isSupportBuyTokens}
            icon={<Icon phosphorIcon={ShoppingCartSimple} weight={"fill"} />}
            onClick={onClickNext}
          >
            {t("Buy now")}
          </Button>
        </div>
      </PageWrapper>
    </Layout.Home>
  );
}

const BuyTokens = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: "flex",
    flexDirection: "column",

    ".__scroll-container": {
      flex: 1,
      overflow: "auto",
      paddingLeft: token.padding,
      paddingRight: token.padding,
    },

    ".__buy-icon-wrapper": {
      position: "relative",
      width: 112,
      height: 112,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: token.margin,
      marginBottom: token.marginLG,

      "&:before": {
        content: '""',
        backgroundColor: token.colorSuccess,
        inset: 0,
        position: "absolute",
        display: "block",
        borderRadius: "100%",
        opacity: "0.1",
      },
    },

    ".__buy-icon": {
      fontSize: 64,
      color: token.colorSuccess,
    },

    ".__note": {
      paddingTop: token.paddingXXS,
      paddingBottom: token.padding,
      color: token.colorTextLight5,
      textAlign: "center",
    },

    ".__layout-footer": {
      display: "flex",
      padding: token.paddingMD,
      paddingBottom: token.paddingLG,
      gap: token.paddingXS,

      ".ant-btn": {
        flex: 1,
      },

      ".full-width": {
        minWidth: "100%",
      },
    },
  };
});

export default BuyTokens;
