// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import { TFunction } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {ChainRegistry, CurrentNetworkInfo} from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import crowdloans from '@polkadot/extension-koni-ui/assets/home-tab-icon/crowdloans.svg';
import crowdloansActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/crowdloans-active.svg';
import crypto from '@polkadot/extension-koni-ui/assets/home-tab-icon/crypto.svg';
import cryptoActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/crypto-active.svg';
import nfts from '@polkadot/extension-koni-ui/assets/home-tab-icon/nfts.svg';
import nftsActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/nfts-active.svg';
import staking from '@polkadot/extension-koni-ui/assets/home-tab-icon/staking.svg';
import stakingActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/staking-active.svg';
import transfers from '@polkadot/extension-koni-ui/assets/home-tab-icon/transfers.svg';
import transfersActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/transfers-active.svg';
import { AccountContext, Link } from '@polkadot/extension-koni-ui/components';
import AccountQrModal from '@polkadot/extension-koni-ui/components/AccountQrModal';
import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import useAccountBalance from '@polkadot/extension-koni-ui/hooks/screen/home/useAccountBalance';
import useCrowdloanNetworks from '@polkadot/extension-koni-ui/hooks/screen/home/useCrowdloanNetworks';
import useShowedNetworks from '@polkadot/extension-koni-ui/hooks/screen/home/useShowedNetworks';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { Header } from '@polkadot/extension-koni-ui/partials';
import AddAccount from '@polkadot/extension-koni-ui/Popup/Accounts/AddAccount';
import TabHeaders from '@polkadot/extension-koni-ui/Popup/Home/Tabs/TabHeaders';
import { TabHeaderItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

import buyIcon from '../../assets/buy-icon.svg';
import sendIcon from '../../assets/send-icon.svg';
import swapIcon from '../../assets/swap-icon.svg';
import ChainBalances from './ChainBalances/ChainBalances';
import Crowdloans from './Crowdloans/Crowdloans';
import StackingEmptyList from './Stacking/EmptyList';
import TransactionHistory from './TransactionHistory/TransactionHistory';
import ActionButton from './ActionButton';
import NftContainer from "@polkadot/extension-koni-ui/Popup/Home/Nfts/NftContainer";

interface WrapperProps extends ThemeProps {
  className?: string;
}

interface Props {
  className?: string;
  currentAccount: AccountJson;
  network: CurrentNetworkInfo;
  chainRegistryMap: Record<string, ChainRegistry>;
}

function getTabHeaderItems (t: TFunction): TabHeaderItemType[] {
  return [
    {
      tabId: 1,
      label: t('Crypto'),
      lightIcon: crypto,
      darkIcon: crypto,
      activatedLightIcon: cryptoActive,
      activatedDarkIcon: cryptoActive
    },
    {
      tabId: 2,
      label: t('NFTs'),
      lightIcon: nfts,
      darkIcon: nfts,
      activatedLightIcon: nftsActive,
      activatedDarkIcon: nftsActive
    },
    {
      tabId: 3,
      label: t('Crowdloans'),
      lightIcon: crowdloans,
      darkIcon: crowdloans,
      activatedLightIcon: crowdloansActive,
      activatedDarkIcon: crowdloansActive
    },
    {
      tabId: 4,
      label: t('Staking'),
      lightIcon: staking,
      darkIcon: staking,
      activatedLightIcon: stakingActive,
      activatedDarkIcon: stakingActive
    },
    {
      tabId: 5,
      label: t('Transfers'),
      lightIcon: transfers,
      darkIcon: transfers,
      activatedLightIcon: transfersActive,
      activatedDarkIcon: transfersActive
    }
  ];
}

function Wrapper ({ className, theme }: WrapperProps): React.ReactElement {
  const { hierarchy } = useContext(AccountContext);
  const { currentAccount: { account: currentAccount },
    currentNetwork,
    chainRegistry: chainRegistryMap } = useSelector((state: RootState) => state);

  if (!hierarchy.length) {
    return (<AddAccount />);
  }

  if (!currentAccount) {
    return (<></>);
  }

  console.log('currentAccount', currentAccount);

  return (<Home
    className={className}
    currentAccount={currentAccount}
    network={currentNetwork}
    chainRegistryMap={chainRegistryMap}
  />);
}

function Home ({ className, currentAccount, network, chainRegistryMap }: Props): React.ReactElement {
  const { icon: iconTheme,
    networkKey,
    networkPrefix } = network;
  const { t } = useTranslation();
  const { address } = currentAccount;

  const backupTabId = window.localStorage.getItem('homeActiveTab') || '1';
  const [activatedTab, setActivatedTab] = useState<number>(Number(backupTabId));
  const _setActiveTab = useCallback((tabId: number) => {
    window.localStorage.setItem('homeActiveTab', `${tabId}`);
    setActivatedTab(tabId);
  }, []);
  const [isShowZeroBalances, setShowZeroBalances] = useState<boolean>(
    window.localStorage.getItem('show_zero_balances') === '1'
  );
  const [isQrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [
    { iconTheme: qrModalIconTheme,
      networkKey: qrModalNetworkKey,
      networkPrefix: qrModalNetworkPrefix,
      showExportButton: qrModalShowExportButton }, setQrModalProps] = useState({
    networkPrefix,
    networkKey,
    iconTheme,
    showExportButton: true
  });

  console.log('networkKey==========', networkKey);

  const showedNetworks = useShowedNetworks(networkKey);
  const crowdloanNetworks = useCrowdloanNetworks(networkKey);

  const { crowdloanContributeMap,
    networkBalanceMaps,
    totalBalanceValue } = useAccountBalance(networkKey, showedNetworks, crowdloanNetworks);
  const { networkMetadata: networkMetadataMap } = useSelector((state: RootState) => state);

  const _toggleZeroBalances = (): void => {
    setShowZeroBalances((v) => {
      window.localStorage.setItem('show_zero_balances', v ? '0' : '1');

      return !v;
    });
  };

  const _showQrModal = (): void => {
    setQrModalProps({
      networkPrefix: networkPrefix,
      networkKey: networkKey,
      iconTheme: iconTheme,
      showExportButton: true
    });

    setQrModalOpen(true);
  };

  const _closeQrModal = (): void => setQrModalOpen(false);

  return (
    <div className={`home-screen home ${className}`}>
      <Header
        className={'home-header'}
        isContainDetailHeader={true}
        isShowZeroBalances={isShowZeroBalances}
        showAdd
        showSearch
        showSettings
        text={t<string>('Accounts')}
        toggleZeroBalances={_toggleZeroBalances}
      />

      <div className={'home-action-block'}>
        <div className='account-total-balance'>
          <BalanceVal
            startWithSymbol
            symbol={'$'}
            value={totalBalanceValue}
          />
        </div>

        <div className='home-account-button-container'>
          <div className='action-button-wrapper'>
            <ActionButton
              iconSrc={buyIcon}
              onClick={_showQrModal}
              tooltipContent={t<string>('Receive')}
            />
          </div>

          <Link
            className={'action-button-wrapper'}
            to={'/account/send-fund'}
          >
            <ActionButton
              iconSrc={sendIcon}
              tooltipContent={t<string>('Send')}
            />
          </Link>

          <div className='action-button-wrapper'>
            <ActionButton
              iconSrc={swapIcon}
              tooltipContent={t<string>('Swap')}
            />
          </div>
        </div>
      </div>

      <div className={'home-tab-contents'}>
        {activatedTab === 1 && (
          <ChainBalances
            address={address}
            currentNetworkKey={networkKey}
            isShowZeroBalances={isShowZeroBalances}
            networkBalanceMaps={networkBalanceMaps}
            networkKeys={showedNetworks}
            networkMetadataMap={networkMetadataMap}
            setQrModalOpen={setQrModalOpen}
            setQrModalProps={setQrModalProps}
          />
        )}

        {activatedTab === 2 && (
          <NftContainer />
        )}

        {activatedTab === 3 && (
          <Crowdloans
            crowdloanContributeMap={crowdloanContributeMap}
            networkKeys={crowdloanNetworks}
            networkMetadataMap={networkMetadataMap}
          />
        )}

        {activatedTab === 4 && (
          <StackingEmptyList />
        )}

        {activatedTab === 5 && (
          <TransactionHistory
            networkKeys={showedNetworks}
            address={address}
            registryMap={chainRegistryMap}
          />
        )}
      </div>

      <TabHeaders
        activatedItem={activatedTab}
        className={'home-tab-headers'}
        items={getTabHeaderItems(t)}
        onSelectItem={_setActiveTab}
      />

      {isQrModalOpen && (
        <AccountQrModal
          accountName={currentAccount.name}
          address={address}
          className='home__account-qr-modal'
          closeModal={_closeQrModal}
          iconTheme={qrModalIconTheme}
          networkKey={qrModalNetworkKey}
          networkPrefix={qrModalNetworkPrefix}
          showExportButton={qrModalShowExportButton}
        />
      )}
    </div>
  );
}

export default React.memo(styled(Wrapper)(({ theme }: WrapperProps) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .home-tab-contents {
    flex: 1;
    overflow: auto;
  }

  .home-action-block {
    display: flex;
    padding: 20px 25px;
  }

  .account-total-balance {
    flex: 1;
    font-weight: 500;
    font-size: 32px;
    line-height: 44px;
  }

  .home-account-button-container {
    display: flex;
  }

  .action-button-wrapper {
    opacity: 1;
    margin-right: 10px;
  }

  .action-button-wrapper:last-child {
    margin-right: 0;
  }

  .home__account-qr-modal .subwallet-modal {
    max-width: 460px;
  }

`));
