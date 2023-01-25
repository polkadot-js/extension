// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PHISHING_PAGE_REDIRECT } from '@subwallet/extension-base/defaults';
import { LoadingContainer } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import PhishingDetected from '@subwallet/extension-koni-ui/Popup/PhishingDetected';
import Root, { initRootPromise } from '@subwallet/extension-koni-ui/Popup/Root';
import React, { useContext } from 'react';
import { Await, Outlet } from 'react-router';
import { createHashRouter } from 'react-router-dom';

export interface PageWrapperProps {
  resolve?: PromiseLike<any>
  children?: React.ReactElement;
}

const defaultResolver = Promise.resolve('');

// Todo: Create data loader wrapper
// Todo: Create loading effect
export function PageWrapper ({ children, resolve }: PageWrapperProps) {
  return <React.Suspense fallback={<LoadingContainer />}>
    <Await resolve={resolve || defaultResolver}>
      {children}
    </Await>
  </React.Suspense>;
}

export function Crypto () {
  const dataContext = useContext(DataContext);

  return <PageWrapper resolve={dataContext.awaitData(['price'])}>
    <div>Crypto</div>
  </PageWrapper>;
}

// Todo: Create error page
export const router = createHashRouter([{ path: '/',
  element: <Root />,
  loader: initRootPromise,
  children: [{
    path: '/welcome',
    element: <div>Welcome</div>
  },
  {
    path: '/home',
    element: <Outlet />,
    children: [{
      path: 'crypto',
      element: <Crypto />
    },
    {
      path: 'nft',
      element: <PageWrapper>
        <div>NFT</div>
      </PageWrapper>
    }]
  }] },
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
