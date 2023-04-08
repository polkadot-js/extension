// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PHISHING_PAGE_REDIRECT } from "@subwallet/extension-base/defaults";
import { PageWrapper } from "@subwallet-webapp/components";
import { Root } from "@subwallet-webapp/Popup/Root";
import { i18nPromise } from "@subwallet-webapp/util/common/i18n";
import React, { ComponentType, ReactNode } from "react";
import { createHashRouter, Outlet, useLocation } from "react-router-dom";

export class LazyLoader {
  public loader;

  public element;
  constructor(promise: () => Promise<{ default: ComponentType<any> }>) {
    this.loader = promise;
    this.element = React.lazy(promise);
  }

  public generateRouterObject(path: string): {
    path: string;
    loader: () => Promise<any>;
    element: ReactNode;
  } {
    const Component = this.element;

    return {
      path,
      loader: this.loader,
      element: <Component />,
    };
  }
}

const PhishingDetected = new LazyLoader(
  () => import("@subwallet-webapp/Popup/PhishingDetected")
);
const Welcome = new LazyLoader(() => import("@subwallet-webapp/Popup/Welcome"));
const CreateDone = new LazyLoader(
  () => import("@subwallet-webapp/Popup/CreateDone")
);
const Tokens = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Tokens")
);
const BuyTokens = new LazyLoader(
  () => import("@subwallet-webapp/Popup/BuyTokens")
);
const Staking = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Staking")
);

const NftItemDetail = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Nfts/NftItemDetail")
);
const NftCollections = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Nfts/NftCollections")
);
const NftCollectionDetail = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Nfts/NftCollectionDetail")
);
const NftImport = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Nfts/NftImport")
);

const History = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/History")
);
const Crowdloans = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Crowdloans")
);
const Home = new LazyLoader(() => import("@subwallet-webapp/Popup/Home"));

const Settings = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings")
);
const ManageChains = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Chains/ManageChains")
);
const ChainImport = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Chains/ChainImport")
);
const AddProvider = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Chains/AddProvider")
);
const ChainDetail = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Chains/ChainDetail")
);
const ManageTokens = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Tokens/ManageTokens")
);
const FungibleTokenImport = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Tokens/FungibleTokenImport")
);
const TokenDetail = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Tokens/TokenDetail")
);
const GeneralSetting = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/GeneralSetting")
);
const TokenDetailList = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Home/Tokens/DetailList")
);

const SecurityList = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Security")
);
const ManageWebsiteAccess = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Settings/Security/ManageWebsiteAccess")
);
const ManageWebsiteAccessDetail = new LazyLoader(
  () =>
    import(
      "@subwallet-webapp/Popup/Settings/Security/ManageWebsiteAccess/Detail"
    )
);

const NewSeedPhrase = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/NewSeedPhrase")
);
const ImportSeedPhrase = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/ImportSeedPhrase")
);
const ImportPrivateKey = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/ImportPrivateKey")
);
const RestoreJson = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/RestoreJson")
);
const ImportQrCode = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/ImportQrCode")
);
const AttachReadOnly = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/AttachReadOnly")
);
const ConnectParitySigner = new LazyLoader(
  () =>
    import(
      "@subwallet-webapp/Popup/Account/ConnectQrSigner/ConnectParitySigner"
    )
);
const ConnectKeystone = new LazyLoader(
  () =>
    import("@subwallet-webapp/Popup/Account/ConnectQrSigner/ConnectKeystone")
);
const ConnectLedger = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/ConnectLedger")
);

const Login = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Keyring/Login")
);
const CreatePassword = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Keyring/CreatePassword")
);
const ChangePassword = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Keyring/ChangePassword")
);
const ApplyMasterPassword = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Keyring/ApplyMasterPassword")
);

const AccountDetail = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/AccountDetail")
);
const AccountExport = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Account/AccountExport")
);

const Transaction = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/Transaction")
);
const TransactionDone = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/TransactionDone")
);
const SendFund = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/variants/SendFund")
);
const SendNFT = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/variants/SendNFT")
);
const Stake = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/variants/Stake")
);
const Unstake = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/variants/Unbond")
);
const CancelUnstake = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/variants/CancelUnstake")
);
const ClaimReward = new LazyLoader(
  () => import("@subwallet-webapp/Popup/Transaction/variants/ClaimReward")
);
const ErrorFallback = new LazyLoader(
  () => import("@subwallet-webapp/Popup/ErrorFallback")
);

// A Placeholder page
export function Example() {
  const location = useLocation();

  return (
    <PageWrapper>
      <div style={{ padding: 16 }}>{location.pathname}</div>
    </PageWrapper>
  );
}

// Todo: Create error page
export const router = createHashRouter([
  {
    path: "/",
    loader: () => i18nPromise,
    element: <Root />,
    errorElement: <ErrorFallback.element />,
    children: [
      Welcome.generateRouterObject("/welcome"),
      BuyTokens.generateRouterObject("/buy-tokens"),
      CreateDone.generateRouterObject("/create-done"),
      {
        ...Home.generateRouterObject("/home"),
        children: [
          Tokens.generateRouterObject("tokens"),
          TokenDetailList.generateRouterObject("tokens/detail/:slug"),
          {
            path: "nfts",
            element: <Outlet />,
            children: [
              NftCollections.generateRouterObject("collections"),
              NftCollectionDetail.generateRouterObject("collection-detail"),
              NftItemDetail.generateRouterObject("item-detail"),
            ],
          },
          Crowdloans.generateRouterObject("crowdloans"),
          Staking.generateRouterObject("staking"),
          History.generateRouterObject("history"),
          History.generateRouterObject("history/:chain/:extrinsicHash"),
        ],
      },
      {
        ...Transaction.generateRouterObject("/transaction"),
        children: [
          SendFund.generateRouterObject("send-fund"),
          SendNFT.generateRouterObject(
            "send-nft/:owner/:chain/:collectionId/:itemId"
          ),
          Stake.generateRouterObject("stake/:type/:chain"),
          Unstake.generateRouterObject("unstake/:type/:chain"),
          CancelUnstake.generateRouterObject("cancel-unstake/:type/:chain"),
          ClaimReward.generateRouterObject("claim-reward/:type/:chain"),
          {
            path: "compound",
            element: <Example />,
          },
          TransactionDone.generateRouterObject(
            "done/:chainType/:chain/:extrinsicHash"
          ),
        ],
      },
      {
        path: "/keyring",
        element: <Outlet />,
        children: [
          Login.generateRouterObject("login"),
          CreatePassword.generateRouterObject("create-password"),
          ChangePassword.generateRouterObject("change-password"),
          ApplyMasterPassword.generateRouterObject("migrate-password"),
        ],
      },
      {
        path: "/settings",
        element: <Outlet />,
        children: [
          Settings.generateRouterObject("list"),
          GeneralSetting.generateRouterObject("general"),
          SecurityList.generateRouterObject("security"),
          ManageWebsiteAccess.generateRouterObject("dapp-access"),
          ManageWebsiteAccessDetail.generateRouterObject("dapp-access-edit"),
          {
            path: "chains",
            element: <Outlet />,
            children: [
              ManageChains.generateRouterObject("manage"),
              ChainImport.generateRouterObject("import"),
              ChainDetail.generateRouterObject("detail"),
              AddProvider.generateRouterObject("add-provider"),
            ],
          },
          {
            path: "tokens",
            element: <Outlet />,
            children: [
              ManageTokens.generateRouterObject("manage"),
              FungibleTokenImport.generateRouterObject("import-token"),
              TokenDetail.generateRouterObject("detail"),
              NftImport.generateRouterObject("import-nft"),
            ],
          },
        ],
      },
      {
        path: "accounts",
        element: <Outlet />,
        children: [
          NewSeedPhrase.generateRouterObject("new-seed-phrase"),
          ImportSeedPhrase.generateRouterObject("import-seed-phrase"),
          ImportPrivateKey.generateRouterObject("import-private-key"),
          RestoreJson.generateRouterObject("restore-json"),
          ImportQrCode.generateRouterObject("import-by-qr"),
          AttachReadOnly.generateRouterObject("attach-read-only"),
          ConnectParitySigner.generateRouterObject("connect-parity-signer"),
          ConnectKeystone.generateRouterObject("connect-keystone"),
          ConnectLedger.generateRouterObject("connect-ledger"),
          AccountDetail.generateRouterObject("detail/:accountAddress"),
          AccountExport.generateRouterObject("export/:accountAddress"),
        ],
      },
    ],
  },
  PhishingDetected.generateRouterObject(`${PHISHING_PAGE_REDIRECT}/:website`),
]);
