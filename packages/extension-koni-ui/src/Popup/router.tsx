// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PHISHING_PAGE_REDIRECT } from '@subwallet/extension-base/defaults';
import { Root } from '@subwallet/extension-koni-ui/Popup/Root';
import React from 'react';
import { createHashRouter, Outlet, useLocation, useRouteError } from 'react-router-dom';

import SendFund from './Transaction/SendFund';

const SelectAccount = React.lazy(() => import('@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount'));
const AddAccount = React.lazy(() => import('./Accounts/AddAccount'));
const Login = React.lazy(() => import('./Login'));
const PhishingDetected = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/PhishingDetected'));
const PageWrapper = React.lazy(() => import('../components/Layout/PageWrapper'));
const Welcome = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Welcome'));
const Tokens = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Tokens'));
const Staking = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking'));

const NftItemDetail = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftItemDetail'));
const NftCollections = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftCollections'));
const NftCollectionDetail = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftCollectionDetail'));
const NftImport = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/NftImport'));

const History = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/History'));
const Crowdloans = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Crowdloans'));
const Home = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home'));

const Settings = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings'));
const ManageTokens = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/ManageTokens'));
const FungibleTokenImport = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/Tokens/FungibleTokenImport'));
const GeneralSetting = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/GeneralSetting'));

const ErrorFallback = () => {
  const error = useRouteError();

  console.error(error);

  return (
    <div>
      <h1>An Error Occurred</h1>
      <p>Sorry, something went wrong. Please try again later.</p>
    </div>
  );
};

// A Placeholder page
export function Example () {
  const location = useLocation();

  return <PageWrapper>
    <div style={{ padding: 16 }}>{location.pathname}</div>
  </PageWrapper>;
}

// Todo: Create error page
export const router = createHashRouter([{
  path: '/',
  element: <Root />,
  errorElement: <ErrorFallback />,
  children: [
    {
      path: '/welcome',
      element: <Welcome title={'Welcome Content'} />
    },
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/home',
      element: <Home />,
      children: [{
        path: 'tokens',
        element: <Tokens />
      },
      {
        path: 'nfts',
        element: <Outlet />,
        children: [
          {
            path: 'collections',
            element: <NftCollections />
          },
          {
            path: 'collection-detail',
            element: <NftCollectionDetail />
          },
          {
            path: 'item-detail',
            element: <NftItemDetail />
          },
          {
            path: 'import-collection',
            element: <NftImport />
          }
        ]
      },
      {
        path: 'crowdloans',
        element: <Crowdloans />
      },
      {
        path: 'staking',
        element: <Staking />
      },
      {
        path: 'history',
        element: <History />
      }]
    },
    {
      path: '/transaction',
      element: <Outlet />,
      children: [{
        path: 'send-fund',
        element: <SendFund />
      }, {
        path: 'send-nft',
        element: <Example />
      }, {
        path: 'stake',
        element: <Example />
      }, {
        path: 'unstake',
        element: <Example />
      }, {
        path: 'withdraw',
        element: <Example />
      }, {
        path: 'claim-reward',
        element: <Example />
      }, {
        path: 'compound',
        element: <Example />
      }]
    },
    {
      path: '/account',
      element: <Outlet />,
      children: [{
        path: 'account-list',
        element: <SelectAccount />
      }, {
        path: 'add-account',
        element: <AddAccount />,
        children: [{
          path: 'from-seed',
          element: <Example />
        }, {
          path: 'derive',
          element: <Example />
        }, {
          path: 'from-json',
          element: <Example />
        }, {
          path: 'attach-readonly',
          element: <Example />
        }, {
          path: 'attach-qr',
          element: <Example />
        }, {
          path: 'attach-ledger',
          element: <Example />
        }]
      }, {
        path: 'account-detail/:accountId',
        element: <Example />,
        children: [{
          path: 'export',
          element: <Example />
        }]
      }]
    },
    {
      path: '/settings',
      element: <Outlet />,
      children: [{
        path: 'list',
        element: <Settings />
      }, {
        path: 'general',
        element: <GeneralSetting />
      }, {
        path: 'dapp-access',
        element: <Example />
      }, {
        path: 'dapp-access-edit',
        element: <Example />
      }, {
        path: 'network',
        element: <Example />
      }, {
        path: 'network-edit',
        element: <Example />
      }, {
        path: 'tokens',
        element: <ManageTokens />,
        children: [
          {
            path: 'import',
            element: <FungibleTokenImport />
          },
          {
            path: 'detail/:tokenSlug',
            element: <Example />
          }
        ]
      }, {
        path: 'master-password',
        element: <Example />
      }]
    }]
},
{ path: `${PHISHING_PAGE_REDIRECT}/website`, element: <PhishingDetected /> }
]);

// const Home = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home'));
// const StakeCompoundSubmitTransaction = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/StakeCompoundSubmitTransaction'));
// const UnbondingSubmitTransaction = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Bonding/UnbondingSubmitTransaction'));
// const BondingSubmitTransaction = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Bonding/BondingSubmitTransaction'));
// const BondingValidatorSelection = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Bonding/BondingValidatorSelection'));
// const BondingNetworkSelection = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Bonding/BondingNetworkSelection'));
// const TokenEdit = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/TokenSetting/CustomTokenEdit'));
// const TokenSetting = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/TokenSetting/CustomTokenSetting'));
// const Welcome = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Welcome'));
// const Signing = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Signing'));
// const Confirmation = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Confirmation'));
// const RestoreJson = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/RestoreJson'));
// const PhishingDetected = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/PhishingDetected'));
// const Metadata = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Metadata'));
// const ImportSeed = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportSeed'));
// const AttachQrSigner = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Attach/AttachQrSigner'));
// const ImportSecretQr = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Attach/ImportSecretQr'));
// const AttachReadOnly = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Attach/AttachReadOnly'));
// const ImportMetamaskPrivateKey = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportMetamaskPrivateKey'));
// const Forget = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Forget'));
// const Export = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Export'));
// const Derive = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Derive'));
// const CreateAccount = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/CreateAccount'));
// const Authorize = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Authorize'));
// const AuthList = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/AuthManagement'));
// const TransferNftContainer = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/transfer/TransferNftContainer'));
// const ImportLedger = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportLedger'));
// const ImportNft = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportToken/ImportNft'));
// const ImportToken = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportToken/ImportToken'));
// const SendFund = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Sending/SendFund'));
// const Settings = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings'));
// const GeneralSetting = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/GeneralSetting'));
// const NetworkCreate = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/NetworkSettings/NetworkEdit'));
// const Networks = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/NetworkSettings/Networks'));
// const Donate = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Sending/Donate'));
// const ErrorBoundary = React.lazy(() => import('@subwallet/extension-koni-ui/components/ErrorBoundary'));
// const ExternalRequest = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ExternalRequest'));
// const XcmTransfer = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/XcmTransfer/XcmTransfer'));
//
// function wrapWithErrorBoundary (trigger: string): React.ReactElement {
//   return <ErrorBoundary trigger={trigger}><div></div></ErrorBoundary>;
// }
//
// export const router = createHashRouter([
//   { path: '/',
//     element: <Root />,
//     errorElement: wrapWithErrorBoundary('Home'),
//     children: [
//       { path: '/home', element: <Home />, errorElement: wrapWithErrorBoundary('Home') },
//       { path: '/welcome', element: <Welcome />, errorElement: wrapWithErrorBoundary('welcome') },
//       { path: '/authorize', element: <Authorize />, errorElement: wrapWithErrorBoundary('authorize') },
//       { path: '/metadata', element: <Metadata />, errorElement: wrapWithErrorBoundary('metadata') },
//       { path: '/signing', element: <Signing />, errorElement: wrapWithErrorBoundary('signing') },
//       { path: '/confirmation', element: <Confirmation />, errorElement: wrapWithErrorBoundary('confirmation') },
//       { path: '/auth-list', element: <AuthList />, errorElement: wrapWithErrorBoundary('auth-list') },
//       { path: '/confirmation', element: <AuthList />, errorElement: wrapWithErrorBoundary('confirmation') },
//       { path: '/account/create', element: <CreateAccount />, errorElement: wrapWithErrorBoundary('account-creation') },
//       { path: '/account/forget/:address', element: <Forget />, errorElement: wrapWithErrorBoundary('forget-address') },
//       { path: '/account/export/:address', element: <Export />, errorElement: wrapWithErrorBoundary('export-address') },
//       // { path: '/account/export-all', element: wrapWithErrorBoundary(<ExportAll />, 'export-all-address') },, errorElement: ,
//       { path: '/account/import-ledger', element: <ImportLedger />, errorElement: wrapWithErrorBoundary('import-ledger') },
//       { path: '/account/attach-qr-signer', element: <AttachQrSigner />, errorElement: wrapWithErrorBoundary('attach-qr-signer') },
//       { path: '/account/attach-read-only', element: <AttachReadOnly />, errorElement: wrapWithErrorBoundary('attach-read-only') },
//       { path: '/account/import-secret-qr', element: <ImportSecretQr />, errorElement: wrapWithErrorBoundary('import-secret-qr') },
//       { path: '/account/scan-qr', element: <ExternalRequest />, errorElement: wrapWithErrorBoundary('scan-qr') },
//       { path: '/account/import-seed', element: <ImportSeed />, errorElement: wrapWithErrorBoundary('import-seed') },
//       {
//         path: '/account/import-metamask-private-key',
//         element: <ImportMetamaskPrivateKey />,
//         errorElement: wrapWithErrorBoundary('import-metamask-private-key')
//       },
//       { path: '/account/restore-json', element: <RestoreJson />, errorElement: wrapWithErrorBoundary('restore-json') },
//       {
//         path: '/account/derive/:address/locked',
//         element: <Derive isLocked />,
//         errorElement: wrapWithErrorBoundary('derived-address-locked')
//       },
//       { path: '/account/derive/:address', element: <Derive />, errorElement: wrapWithErrorBoundary('derive-address') },
//       { path: '/account/settings', element: <Settings />, errorElement: wrapWithErrorBoundary('account-settings') },
//       { path: '/account/general-setting', element: <GeneralSetting />, errorElement: wrapWithErrorBoundary('account-general-settings') },
//       { path: '/account/networks', element: <Networks />, errorElement: wrapWithErrorBoundary('account-networks') },
//       { path: '/account/config-network', element: <NetworkCreate />, errorElement: wrapWithErrorBoundary('account-network-edit') },
//       { path: '/account/xcm-transfer', element: <XcmTransfer />, errorElement: wrapWithErrorBoundary('xcm-transfer') },
//       { path: '/account/send-fund', element: <SendFund />, errorElement: wrapWithErrorBoundary('send-fund') },
//       { path: '/account/donate', element: <Donate />, errorElement: wrapWithErrorBoundary('donate') },
//       { path: '/account/send-nft', element: <TransferNftContainer />, errorElement: wrapWithErrorBoundary('send-nft') },
//       { path: '/account/import-token', element: <ImportToken />, errorElement: wrapWithErrorBoundary('import-token') },
//       { path: '/account/import-nft', element: <ImportNft />, errorElement: wrapWithErrorBoundary('import-nft') },
//       { path: '/account/token-setting', element: <TokenSetting />, errorElement: wrapWithErrorBoundary('token-setting') },
//       { path: '/account/token-edit', element: <TokenEdit />, errorElement: wrapWithErrorBoundary('token-edit') },
//       {
//         path: '/account/select-bonding-network',
//         element: <BondingNetworkSelection />,
//         errorElement: wrapWithErrorBoundary('bonding-network')
//       },
//       {
//         path: '/account/select-bonding-validator',
//         element: <BondingValidatorSelection />,
//         errorElement: wrapWithErrorBoundary('bonding-validator')
//       },
//       { path: '/account/bonding-auth', element: <BondingSubmitTransaction />, errorElement: wrapWithErrorBoundary('bonding-auth') },
//       { path: '/account/unbonding-auth', element: <UnbondingSubmitTransaction />, errorElement: wrapWithErrorBoundary('unbonding-auth') },
//       {
//         path: '/account/stake-compounding-auth',
//         element: <StakeCompoundSubmitTransaction />,
//         errorElement: wrapWithErrorBoundary('stake-compounding-auth')
//       }
//     ] },
//   { path: `${PHISHING_PAGE_REDIRECT}/website`, element: <PhishingDetected />, errorElement: wrapWithErrorBoundary('phishing-page-redirect') }
// ])
// ;
