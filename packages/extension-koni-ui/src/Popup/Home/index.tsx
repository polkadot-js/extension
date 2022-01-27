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
import cryptoDark from '@polkadot/extension-koni-ui//assets/crypto.svg';
import AccountQrModal from "@polkadot/extension-koni-ui/components/AccountQrModal";
import {AccountJson} from "@polkadot/extension-base/background/types";
import ChainBalances from './ChainBalances/ChainBalances';
import Crowdloans from './Crowdloans/Crowdloans';
import TransactionHistory from './TransactionHistory/TransactionHistory';
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
      lightIcon: cryptoDark,
      darkIcon: cryptoDark,
      activatedLightIcon: cryptoDark,
      activatedDarkIcon: cryptoDark
    },
    {
      tabId: 2,
      label: t('NFTs'),
      lightIcon: cryptoDark,
      darkIcon: cryptoDark,
      activatedLightIcon: cryptoDark,
      activatedDarkIcon: cryptoDark
    },
    {
      tabId: 3,
      label: t('Crowdloans'),
      lightIcon: cryptoDark,
      darkIcon: cryptoDark,
      activatedLightIcon: cryptoDark,
      activatedDarkIcon: cryptoDark
    },
    {
      tabId: 4,
      label: t('Staking'),
      lightIcon: cryptoDark,
      darkIcon: cryptoDark,
      activatedLightIcon: cryptoDark,
      activatedDarkIcon: cryptoDark
    },
    {
      tabId: 5,
      label: t('Transfers'),
      lightIcon: cryptoDark,
      darkIcon: cryptoDark,
      activatedLightIcon: cryptoDark,
      activatedDarkIcon: cryptoDark
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
  networkName: 'all',
  iconTheme: 'polkadot',
}

function Home({className, currentAccount}: Props): React.ReactElement {
  const {
    networkPrefix,
    networkName,
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
      networkName: qrModalNetworkName,
      iconTheme: qrModalIconTheme,
      showExportButton: qrModalShowExportButton
    }, setQrModalProps]
    = useState({
    networkPrefix,
    networkName,
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
        networkName: networkName,
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
          <div>NFTs here</div>
        )}

        {activatedTab === 3 && (
          <Crowdloans/>
        )}

        {activatedTab === 4 && (
          <div>Stacking here</div>
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
          closeModal={_closeQrModal}
          address={address}
          accountName={currentAccount.name}
          networkPrefix={qrModalNetworkPrefix}
          networkName={qrModalNetworkName}
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
  }

  .home-action-block {
    display: flex;
  }

  .account-total-balance {
    flex: 1;
  }

  .home-account-button-container {
    display: flex;
  }

  .action-button-wrapper {
    opacity: 1;
  }
`));
