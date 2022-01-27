import React, {useContext, useState} from 'react';
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import AddAccount from "@polkadot/extension-koni-ui/Popup/Accounts/AddAccount";
import {AccountContext, Link} from "@polkadot/extension-koni-ui/components";
import useTranslation from "@polkadot/extension-koni-ui/hooks/useTranslation";
import {Header} from "@polkadot/extension-koni-ui/partials";
import styled from 'styled-components';
import TabHeaders from "@polkadot/extension-koni-ui/Popup/Home/Tabs/TabHeaders";
import {TFunction} from "react-i18next";
import {TabHeaderItemType} from "@polkadot/extension-koni-ui/Popup/Home/types";
import crypto from '@polkadot/extension-koni-ui/assets/home-tab-icon/crypto.svg';
import cryptoActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/crypto-active.svg';
import nfts from '@polkadot/extension-koni-ui/assets/home-tab-icon/nfts.svg';
import nftsActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/nfts-active.svg';
import crowdloans from '@polkadot/extension-koni-ui/assets/home-tab-icon/crowdloans.svg';
import crowdloansActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/crowdloans-active.svg';
import staking from '@polkadot/extension-koni-ui/assets/home-tab-icon/staking.svg';
import stakingActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/staking-active.svg';
import transfers from '@polkadot/extension-koni-ui/assets/home-tab-icon/transfers.svg';
import transfersActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/transfers-active.svg';

import AccountQrModal from "@polkadot/extension-koni-ui/components/AccountQrModal";
import {AccountJson} from "@polkadot/extension-base/background/types";
import ChainBalances from './ChainBalances/ChainBalances';
import TransactionHistory from './TransactionHistory/TransactionHistory';
import Crowdloans from './Crowdloans/Crowdloans';
import StackingEmptyList from './Stacking/EmptyList';
import NftsEmptyList from './Nfts/EmptyList';
import BigN from 'bignumber.js';
import {BalanceVal} from "@polkadot/extension-koni-ui/components/balance";
import ActionButton from './ActionButton';
import buyIcon from '../../assets/buy-icon.svg';
import sendIcon from '../../assets/send-icon.svg';
import swapIcon from '../../assets/swap-icon.svg';

interface WrapperProps extends ThemeProps {
  className?: string;
}

interface Props {
  className?: string;
  currentAccount: AccountJson;
}

function getTabHeaderItems(t: TFunction): TabHeaderItemType[] {
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
  ]
}

function Wrapper({className, theme}: WrapperProps): React.ReactElement {
  const {hierarchy} = useContext(AccountContext);

  if (!hierarchy.length) {
    return (<AddAccount/>);
  }

  const fakeAccount: AccountJson = {
    address: '5HWA78W7x8qi2zbb9BbFhuvvV5jbS8v1c8Mt6E6Y7pvPopEv',
    name: 'Subwallet User'
  }

  return (<Home className={className} currentAccount={fakeAccount}/>);
}

const MockCurrentNetwork = {
  networkPrefix: -1,
  networkKey: 'all',
  iconTheme: 'polkadot',
}

function Home({className, currentAccount}: Props): React.ReactElement {
  const {
    networkPrefix,
    networkKey,
    iconTheme
  } = MockCurrentNetwork;
  const {t} = useTranslation();
  const {address} = currentAccount;
  const [activatedTab, setActivatedTab] = useState<number>(1);
  const [isShowZeroBalances, setShowZeroBalances] = useState<boolean>(
    window.localStorage.getItem('show_zero_balances') === '1'
  );
  const [isQrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [
    {
      networkPrefix: qrModalNetworkPrefix,
      networkKey: qrModalNetworkKey,
      iconTheme: qrModalIconTheme,
      showExportButton: qrModalShowExportButton
    }, setQrModalProps]
    = useState({
    networkPrefix,
    networkKey,
    iconTheme,
    showExportButton: true,
  });

  const _toggleZeroBalances = (): void => {
    setShowZeroBalances(v => {
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

  const totalBalance: BigN = new BigN(2000);

  return (
    <div className={`home-screen home ${className}`}>
      <Header
        className={'home-header'}
        showAdd
        showSearch
        showSettings
        isShowZeroBalances={isShowZeroBalances}
        toggleZeroBalances={_toggleZeroBalances}
        text={t<string>('Accounts')}
        isContainDetailHeader={true}
      />

      <div className={'home-action-block'}>
        <div className='account-total-balance'>
            <BalanceVal value={totalBalance} symbol={'$'} startWithSymbol/>
        </div>

        <div className='home-account-button-container'>
          <div className='action-button-wrapper'>
            <ActionButton
              onClick={_showQrModal}
              tooltipContent={t<string>('Receive')}
              iconSrc={buyIcon}
            />
          </div>

          <Link to={'/account/send-fund'} className={'action-button-wrapper'}>
            <ActionButton
              tooltipContent={t<string>('Send')}
              iconSrc={sendIcon}
            />
          </Link>

          <div className='action-button-wrapper'>
            <ActionButton
              tooltipContent={t<string>('Swap')}
              iconSrc={swapIcon}
            />
          </div>
        </div>
      </div>

      <div className={'home-tab-contents'}>
        {activatedTab === 1 && (
          <ChainBalances
            address={address}
            setQrModalOpen={setQrModalOpen}
            setQrModalProps={setQrModalProps}
          />
        )}

        {activatedTab === 2 && (
          <NftsEmptyList />
        )}

        {activatedTab === 3 && (
          <Crowdloans/>
        )}

        {activatedTab === 4 && (
          <StackingEmptyList />
        )}

        {activatedTab === 5 && (
          <TransactionHistory/>
        )}
      </div>

      <TabHeaders
        className={'home-tab-headers'}
        onSelectItem={setActivatedTab}
        activatedItem={activatedTab}
        items={getTabHeaderItems(t)}
      />

      {isQrModalOpen && (
        <AccountQrModal
          className='home__account-qr-modal'
          closeModal={_closeQrModal}
          address={address}
          accountName={currentAccount.name}
          networkPrefix={qrModalNetworkPrefix}
          networkKey={qrModalNetworkKey}
          iconTheme={qrModalIconTheme}
          showExportButton={qrModalShowExportButton}
        />
      )}
    </div>
  )
}

export default React.memo(styled(Wrapper)(({theme}: WrapperProps) => `
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
