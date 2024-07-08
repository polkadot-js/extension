// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PHISHING_PAGE_REDIRECT } from '@subwallet/extension-base/defaults';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import { AppOnlineContentContextProvider } from '@subwallet/extension-koni-ui/contexts/AppOnlineContentProvider';
import { AppPopupModalContextProvider } from '@subwallet/extension-koni-ui/contexts/AppPopupModalContext';
import ErrorFallback from '@subwallet/extension-koni-ui/Popup/ErrorFallback';
import { Root } from '@subwallet/extension-koni-ui/Popup/Root';
import { i18nPromise } from '@subwallet/extension-koni-ui/utils/common/i18n';
import React, { ComponentType } from 'react';
import { createHashRouter, IndexRouteObject, Outlet, useLocation } from 'react-router-dom';

export const lazyLoaderMap: Record<string, LazyLoader> = {};

export class LazyLoader {
  private elemLoader;
  private loadPromise: Promise<ComponentType<any>> | undefined;

  constructor (key: string, promiseFunction: () => Promise<{ default: ComponentType<any> }>) {
    this.elemLoader = promiseFunction;
    lazyLoaderMap[key] = this;
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

const PhishingDetected = new LazyLoader('PhishingDetected', () => import('@subwallet/extension-koni-ui/Popup/PhishingDetected'));
const Welcome = new LazyLoader('Welcome', () => import('@subwallet/extension-koni-ui/Popup/Welcome'));
const CreateDone = new LazyLoader('CreateDone', () => import('@subwallet/extension-koni-ui/Popup/CreateDone'));
const MV3Migration = new LazyLoader('MV3Migration', () => import('@subwallet/extension-koni-ui/Popup/MV3Migration'));
const RemindExportAccount = new LazyLoader('RemindExportAccount', () => import('@subwallet/extension-koni-ui/Popup/RemindExportAccount'));
const BuyTokens = new LazyLoader('BuyTokens', () => import('@subwallet/extension-koni-ui/Popup/BuyTokens'));
// const Staking = new LazyLoader('Staking', () => import('@subwallet/extension-koni-ui/Popup/Home/Staking'));

const Tokens = new LazyLoader('Tokens', () => import('@subwallet/extension-koni-ui/Popup/Home/Tokens'));
const TokenDetailList = new LazyLoader('TokenDetailList', () => import('@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailList'));

const NftItemDetail = new LazyLoader('NftItemDetail', () => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftItemDetail'));
const NftCollections = new LazyLoader('NftCollections', () => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftCollections'));
const NftCollectionDetail = new LazyLoader('NftCollectionDetail', () => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftCollectionDetail'));
const NftImport = new LazyLoader('NftImport', () => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftImport'));

const History = new LazyLoader('History', () => import('@subwallet/extension-koni-ui/Popup/Home/History'));
const Crowdloans = new LazyLoader('Crowdloans', () => import('@subwallet/extension-koni-ui/Popup/Home/Crowdloans'));
const Home = new LazyLoader('Home', () => import('@subwallet/extension-koni-ui/Popup/Home'));

const Settings = new LazyLoader('Settings', () => import('@subwallet/extension-koni-ui/Popup/Settings'));
const GeneralSetting = new LazyLoader('GeneralSetting', () => import('@subwallet/extension-koni-ui/Popup/Settings/GeneralSetting'));
const MissionPools = new LazyLoader('MissionPools', () => import('@subwallet/extension-koni-ui/Popup/Settings/MissionPool/index'));
const ManageAddressBook = new LazyLoader('ManageAddressBook', () => import('@subwallet/extension-koni-ui/Popup/Settings/AddressBook'));

const ManageChains = new LazyLoader('ManageChains', () => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/ManageChains'));
const ChainImport = new LazyLoader('ChainImport', () => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/ChainImport'));
const AddProvider = new LazyLoader('AddProvider', () => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/AddProvider'));
const ChainDetail = new LazyLoader('ChainDetail', () => import('@subwallet/extension-koni-ui/Popup/Settings/Chains/ChainDetail'));

const ManageTokens = new LazyLoader('ManageTokens', () => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/ManageTokens'));
const FungibleTokenImport = new LazyLoader('FungibleTokenImport', () => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/FungibleTokenImport'));
const TokenDetail = new LazyLoader('TokenDetail', () => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/TokenDetail'));

const SecurityList = new LazyLoader('SecurityList', () => import('@subwallet/extension-koni-ui/Popup/Settings/Security'));
const ManageWebsiteAccess = new LazyLoader('ManageWebsiteAccess', () => import('@subwallet/extension-koni-ui/Popup/Settings/Security/ManageWebsiteAccess'));
const ManageWebsiteAccessDetail = new LazyLoader('ManageWebsiteAccessDetail', () => import('@subwallet/extension-koni-ui/Popup/Settings/Security/ManageWebsiteAccess/Detail'));

const NewSeedPhrase = new LazyLoader('NewSeedPhrase', () => import('@subwallet/extension-koni-ui/Popup/Account/NewSeedPhrase'));
const ImportSeedPhrase = new LazyLoader('ImportSeedPhrase', () => import('@subwallet/extension-koni-ui/Popup/Account/ImportSeedPhrase'));
const ImportPrivateKey = new LazyLoader('ImportPrivateKey', () => import('@subwallet/extension-koni-ui/Popup/Account/ImportPrivateKey'));
const RestoreJson = new LazyLoader('RestoreJson', () => import('@subwallet/extension-koni-ui/Popup/Account/RestoreJson'));
const ImportQrCode = new LazyLoader('ImportQrCode', () => import('@subwallet/extension-koni-ui/Popup/Account/ImportQrCode'));
const AttachReadOnly = new LazyLoader('AttachReadOnly', () => import('@subwallet/extension-koni-ui/Popup/Account/AttachReadOnly'));
const ConnectPolkadotVault = new LazyLoader('ConnectPolkadotVault', () => import('@subwallet/extension-koni-ui/Popup/Account/ConnectQrSigner/ConnectPolkadotVault'));
const ConnectKeystone = new LazyLoader('ConnectKeystone', () => import('@subwallet/extension-koni-ui/Popup/Account/ConnectQrSigner/ConnectKeystone'));
const ConnectLedger = new LazyLoader('ConnectLedger', () => import('@subwallet/extension-koni-ui/Popup/Account/ConnectLedger'));
const ExportAllDone = new LazyLoader('ExportAllDone', () => import('@subwallet/extension-koni-ui/Popup/Account/ExportAllDone'));

const Login = new LazyLoader('Login', () => import('@subwallet/extension-koni-ui/Popup/Keyring/Login'));
const CreatePassword = new LazyLoader('CreatePassword', () => import('@subwallet/extension-koni-ui/Popup/Keyring/CreatePassword'));
const ChangePassword = new LazyLoader('ChangePassword', () => import('@subwallet/extension-koni-ui/Popup/Keyring/ChangePassword'));
const ApplyMasterPassword = new LazyLoader('ApplyMasterPassword', () => import('@subwallet/extension-koni-ui/Popup/Keyring/ApplyMasterPassword'));

const AccountDetail = new LazyLoader('AccountDetail', () => import('@subwallet/extension-koni-ui/Popup/Account/AccountDetail'));
const AccountExport = new LazyLoader('AccountExport', () => import('@subwallet/extension-koni-ui/Popup/Account/AccountExport'));

const Transaction = new LazyLoader('Transaction', () => import('@subwallet/extension-koni-ui/Popup/Transaction/Transaction'));
const TransactionDone = new LazyLoader('TransactionDone', () => import('@subwallet/extension-koni-ui/Popup/TransactionDone'));
const SendFund = new LazyLoader('SendFund', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/SendFund'));
const SwapTransaction = new LazyLoader('SwapTransaction', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Swap'));
const SendNFT = new LazyLoader('SendNFT', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/SendNFT'));
const Earn = new LazyLoader('Stake', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Earn'));
const Unstake = new LazyLoader('Unstake', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Unbond'));
const CancelUnstake = new LazyLoader('CancelUnstake', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/CancelUnstake'));
const ClaimReward = new LazyLoader('ClaimReward', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/ClaimReward'));
const Withdraw = new LazyLoader('Withdraw', () => import('@subwallet/extension-koni-ui/Popup/Transaction/variants/Withdraw'));

// Earning

const EarningEntry = new LazyLoader('EarningEntry', () => import('@subwallet/extension-koni-ui/Popup/Home/Earning/EarningEntry'));
const EarningPools = new LazyLoader('EarningPools', () => import('@subwallet/extension-koni-ui/Popup/Home/Earning/EarningPools'));
const EarningPositionDetail = new LazyLoader('EarningPositionDetail', () => import('@subwallet/extension-koni-ui/Popup/Home/Earning/EarningPositionDetail'));

// Wallet Connect
const ConnectWalletConnect = new LazyLoader('ConnectWalletConnect', () => import('@subwallet/extension-koni-ui/Popup/WalletConnect/ConnectWalletConnect'));
const ConnectionList = new LazyLoader('ConnectionList', () => import('@subwallet/extension-koni-ui/Popup/WalletConnect/ConnectionList'));
const ConnectionDetail = new LazyLoader('ConnectionDetail', () => import('@subwallet/extension-koni-ui/Popup/WalletConnect/ConnectionDetail'));

const NotFound = new LazyLoader('NotFound', () => import('@subwallet/extension-koni-ui/Popup/NotFound'));

// A Placeholder page
export function Example () {
  const location = useLocation();

  return <PageWrapper>
    <div style={{ padding: 16 }}>{location.pathname}</div>
  </PageWrapper>;
}

export function RootWrapper () {
  return (
    <AppPopupModalContextProvider>
      <AppOnlineContentContextProvider>
        <Root />
      </AppOnlineContentContextProvider>
    </AppPopupModalContextProvider>
  );
}

// Todo: Create error page
export const router = createHashRouter([
  {
    path: '/',
    loader: () => i18nPromise,
    element: <RootWrapper />,
    errorElement: <ErrorFallback />,
    children: [
      Welcome.generateRouterObject('/welcome'),
      BuyTokens.generateRouterObject('/buy-tokens'),
      CreateDone.generateRouterObject('/create-done'),
      MV3Migration.generateRouterObject('/mv3-migration'),
      RemindExportAccount.generateRouterObject('/remind-export-account'),
      {
        ...Home.generateRouterObject('/home'),
        children: [
          Tokens.generateRouterObject('tokens'),
          TokenDetailList.generateRouterObject('tokens/detail/:slug'),
          {
            path: 'nfts',
            element: <Outlet />,
            children: [
              NftCollections.generateRouterObject('collections'),
              NftCollectionDetail.generateRouterObject('collection-detail'),
              NftItemDetail.generateRouterObject('item-detail')
            ]
          },
          // Staking.generateRouterObject('staking'),
          {
            path: 'earning',
            element: <Outlet />,
            children: [
              EarningEntry.generateRouterObject(''),
              EarningPools.generateRouterObject('pools'),
              EarningPositionDetail.generateRouterObject('position-detail')
            ]
          },
          MissionPools.generateRouterObject('mission-pools'),
          History.generateRouterObject('history'),
          History.generateRouterObject('history/:address/:chain/:extrinsicHashOrId')
        ]
      },
      {
        ...Transaction.generateRouterObject('/transaction'),
        children: [
          SendFund.generateRouterObject('send-fund'),
          SwapTransaction.generateRouterObject('swap'),
          SendNFT.generateRouterObject('send-nft'),
          Earn.generateRouterObject('earn'),
          Unstake.generateRouterObject('unstake'),
          CancelUnstake.generateRouterObject('cancel-unstake'),
          ClaimReward.generateRouterObject('claim-reward'),
          Withdraw.generateRouterObject('withdraw'),
          {
            path: 'compound',
            element: <Example />
          }
        ]
      },
      {
        ...TransactionDone.generateRouterObject('transaction-done/:address/:chain/:transactionId')
      },
      {
        path: '/keyring',
        element: <Outlet />,
        children: [
          Login.generateRouterObject('login'),
          CreatePassword.generateRouterObject('create-password'),
          ChangePassword.generateRouterObject('change-password'),
          ApplyMasterPassword.generateRouterObject('migrate-password')
        ]
      },
      {
        path: '/settings',
        element: <Outlet />,
        children: [
          Settings.generateRouterObject('list'),
          GeneralSetting.generateRouterObject('general'),
          Crowdloans.generateRouterObject('crowdloans'),
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
          AccountExport.generateRouterObject('export/:accountAddress'),
          ExportAllDone.generateRouterObject('export-all-done')
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
      },
      NotFound.generateRouterObject('*'),
      PhishingDetected.generateRouterObject(`${PHISHING_PAGE_REDIRECT}/:website`)
    ]
  }
]);
