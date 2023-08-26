// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PHISHING_PAGE_REDIRECT } from '@subwallet/extension-base/defaults';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import ErrorFallback from '@subwallet/extension-koni-ui/Popup/ErrorFallback';
import { Root } from '@subwallet/extension-koni-ui/Popup/Root';
import { i18nPromise } from '@subwallet/extension-koni-ui/utils/common/i18n';
import React, { ComponentType } from 'react';
import { createBrowserRouter, IndexRouteObject, Outlet, useLocation, useOutletContext } from 'react-router-dom';

export class LazyLoader {
  private elemLoader;
  private loadPromise: Promise<ComponentType<any>> | undefined;

  constructor (promiseFunction: () => Promise<{ default: ComponentType<any> }>) {
    this.elemLoader = promiseFunction;
  }

  public loadElement () {
    if (!this.loadPromise) {
      this.loadPromise = new Promise<ComponentType<any>>((resolve, reject) => {
        this.elemLoader().then((module) => {
          resolve(module.default);
        }).catch(reject);
      });
    }

    return this.loadPromise;
  }

  public generateRouterObject (path: string, preload = false): Pick<IndexRouteObject, 'path' | 'lazy'> {
    if (preload) {
      this.loadElement().catch(console.error);
    }

    return {
      path,
      lazy: async () => {
        const Element = await this.loadElement();

        return {
          element: <Element />
        };
      }
    };
  }
}

const PhishingDetected = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/PhishingDetected'));
const Welcome = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Welcome'));
const CreateDone = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/CreateDone'));
const BuyTokens = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/BuyTokens'));
const Staking = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking'));

const Tokens = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Tokens'));
const TokenDetailList = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailList'));

const NftItemDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftItemDetail'));
const NftCollections = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftCollections'));
const NftCollectionDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftCollectionDetail'));
const NftImport = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftImport'));

const History = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/History'));
const Crowdloans = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home/Crowdloans'));
const Home = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Home'));

const Settings = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings'));
const GeneralSetting = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/GeneralSetting'));
const ManageAddressBook = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/AddressBook'));

const ManageChains = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/ManageChains'));
const ChainImport = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/ChainImport'));
const AddProvider = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/AddProvider'));
const ChainDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/ChainDetail'));

const ManageTokens = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/ManageTokens'));
const FungibleTokenImport = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/FungibleTokenImport'));
const TokenDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/TokenDetail'));

const SecurityList = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Security'));
const ManageWebsiteAccess = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Security/ManageWebsiteAccess'));
const ManageWebsiteAccessDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Settings/Security/ManageWebsiteAccess/Detail'));

const NewSeedPhrase = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/NewSeedPhrase'));
const ImportSeedPhrase = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/ImportSeedPhrase'));
const ImportPrivateKey = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/ImportPrivateKey'));
const RestoreJson = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/RestoreJson'));
const ImportQrCode = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/ImportQrCode'));
const AttachReadOnly = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/AttachReadOnly'));
const ConnectPolkadotVault = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/ConnectQrSigner/ConnectPolkadotVault'));
const ConnectKeystone = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/ConnectQrSigner/ConnectKeystone'));
const ConnectLedger = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/ConnectLedger'));

const Login = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Keyring/Login'));
const CreatePassword = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Keyring/CreatePassword'));
const ChangePassword = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Keyring/ChangePassword'));
const ApplyMasterPassword = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Keyring/ApplyMasterPassword'));

const AccountDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/AccountDetail'));
const AccountExport = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Account/AccountExport'));

const Transaction = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/Transaction'));
const TransactionDone = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/TransactionDone'));
const SendFund = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/SendFund'));
const SendNFT = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/SendNFT'));
const Stake = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Stake'));
const Unstake = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Unbond'));
const CancelUnstake = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/CancelUnstake'));
const ClaimReward = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/ClaimReward'));
const Withdraw = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Withdraw'));

// Wallet Connect
const ConnectWalletConnect = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/WalletConnect/ConnectWalletConnect'));
const ConnectionList = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/WalletConnect/ConnectionList'));
const ConnectionDetail = new LazyLoader(() => import('@subwallet/extension-koni-ui/Popup/WalletConnect/ConnectionDetail'));

// A Placeholder page
export function Example () {
  const location = useLocation();

  return <PageWrapper>
    <div style={{ padding: 16 }}>{location.pathname}</div>
  </PageWrapper>;
}

export function NestedOutlet () {
  return <Outlet context={useOutletContext()} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => i18nPromise,
    element: <Root />,
    errorElement: <ErrorFallback />,
    children: [
      Welcome.generateRouterObject('/welcome', true),
      BuyTokens.generateRouterObject('/buy-tokens'),
      CreateDone.generateRouterObject('/create-done'),
      {
        ...Home.generateRouterObject('/home', true),
        children: [
          Tokens.generateRouterObject('tokens', true),
          TokenDetailList.generateRouterObject('tokens/detail/:slug'),
          {
            path: 'nfts',
            element: <NestedOutlet />,
            children: [
              NftCollections.generateRouterObject('collections', true),
              NftCollectionDetail.generateRouterObject('collection-detail'),
              NftItemDetail.generateRouterObject('item-detail')
            ]
          },
          Crowdloans.generateRouterObject('crowdloans', true),
          Staking.generateRouterObject('staking', true),
          History.generateRouterObject('history', true),
          History.generateRouterObject('history/:chain/:extrinsicHashOrId', true),
          {
            path: 'dapps',
            element: <Outlet />
          }
        ]
      },
      {
        ...Transaction.generateRouterObject('/transaction'),
        children: [
          SendFund.generateRouterObject('send-fund'),
          SendNFT.generateRouterObject('send-nft/:owner/:chain/:collectionId/:itemId'),
          Stake.generateRouterObject('stake/:type/:chain'),
          Unstake.generateRouterObject('unstake/:type/:chain'),
          CancelUnstake.generateRouterObject('cancel-unstake/:type/:chain'),
          ClaimReward.generateRouterObject('claim-reward/:type/:chain'),
          Withdraw.generateRouterObject('withdraw/:type/:chain'),
          {
            path: 'compound',
            element: <Example />
          }
        ]
      },
      {
        ...TransactionDone.generateRouterObject('transaction-done/:chainType/:chain/:transactionId')
      },
      {
        path: '/keyring',
        element: <Outlet />,
        children: [
          Login.generateRouterObject('login', true),
          CreatePassword.generateRouterObject('create-password'),
          ChangePassword.generateRouterObject('change-password'),
          ApplyMasterPassword.generateRouterObject('migrate-password')
        ]
      },
      {
        path: '/settings',
        children: [
          Settings.generateRouterObject('/settings', true),
          Settings.generateRouterObject('list', true),
          GeneralSetting.generateRouterObject('general'),
          ManageAddressBook.generateRouterObject('address-book'),
          SecurityList.generateRouterObject('security'),
          ManageWebsiteAccess.generateRouterObject('dapp-access'),
          ManageWebsiteAccessDetail.generateRouterObject('dapp-access-edit'),
          {
            path: 'chains',
            element: <Outlet />,
            children: [
              ManageChains.generateRouterObject('manage'),
              ChainImport.generateRouterObject('import'),
              ChainDetail.generateRouterObject('detail'),
              AddProvider.generateRouterObject('add-provider')
            ]
          },
          {
            path: 'tokens',
            element: <Outlet />,
            children: [
              ManageTokens.generateRouterObject('manage'),
              FungibleTokenImport.generateRouterObject('import-token'),
              TokenDetail.generateRouterObject('detail'),
              NftImport.generateRouterObject('import-nft')
            ]
          }
        ]
      },
      {
        path: 'accounts',
        element: <Outlet />,
        children: [
          NewSeedPhrase.generateRouterObject('new-seed-phrase'),
          ImportSeedPhrase.generateRouterObject('import-seed-phrase'),
          ImportPrivateKey.generateRouterObject('import-private-key'),
          RestoreJson.generateRouterObject('restore-json'),
          ImportQrCode.generateRouterObject('import-by-qr'),
          AttachReadOnly.generateRouterObject('attach-read-only'),
          ConnectPolkadotVault.generateRouterObject('connect-polkadot-vault'),
          ConnectKeystone.generateRouterObject('connect-keystone'),
          ConnectLedger.generateRouterObject('connect-ledger'),
          AccountDetail.generateRouterObject('detail/:accountAddress'),
          AccountExport.generateRouterObject('export/:accountAddress')
        ]
      },
      {
        path: 'wallet-connect',
        element: <Outlet />,
        children: [
          ConnectWalletConnect.generateRouterObject('connect'),
          ConnectionList.generateRouterObject('list'),
          ConnectionDetail.generateRouterObject('detail/:topic')
        ]
      }
    ]
  },
  PhishingDetected.generateRouterObject(`${PHISHING_PAGE_REDIRECT}/:website`)
]);
