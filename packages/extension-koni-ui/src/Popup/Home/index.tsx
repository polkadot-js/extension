// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BigN from 'bignumber.js';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TFunction } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ChainRegistry, CurrentAccountInfo, CurrentNetworkInfo, NftCollection as _NftCollection, NftItem as _NftItem, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
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
import { AccountContext, AccountQrModal, Link } from '@polkadot/extension-koni-ui/components';
import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import Tooltip from '@polkadot/extension-koni-ui/components/Tooltip';
import useAccountBalance from '@polkadot/extension-koni-ui/hooks/screen/home/useAccountBalance';
import useCrowdloanNetworks from '@polkadot/extension-koni-ui/hooks/screen/home/useCrowdloanNetworks';
import useFetchNft from '@polkadot/extension-koni-ui/hooks/screen/home/useFetchNft';
import useFetchStaking from '@polkadot/extension-koni-ui/hooks/screen/home/useFetchStaking';
import useShowedNetworks from '@polkadot/extension-koni-ui/hooks/screen/home/useShowedNetworks';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { saveCurrentAccountAddress, triggerAccountsSubscription } from '@polkadot/extension-koni-ui/messaging';
import { Header } from '@polkadot/extension-koni-ui/partials';
import AddAccount from '@polkadot/extension-koni-ui/Popup/Accounts/AddAccount';
import NftContainer from '@polkadot/extension-koni-ui/Popup/Home/Nfts/render/NftContainer';
import StakingContainer from '@polkadot/extension-koni-ui/Popup/Home/Staking/StakingContainer';
import TabHeaders from '@polkadot/extension-koni-ui/Popup/Home/Tabs/TabHeaders';
import { TabHeaderItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN_ZERO, isAccountAll, NFT_DEFAULT_GRID_SIZE, NFT_GRID_HEIGHT_THRESHOLD, NFT_HEADER_HEIGHT, NFT_PER_ROW, NFT_PREVIEW_HEIGHT } from '@polkadot/extension-koni-ui/util';

import buyIcon from '../../assets/buy-icon.svg';
import donateIcon from '../../assets/donate-icon.svg';
import sendIcon from '../../assets/send-icon.svg';
// import swapIcon from '../../assets/swap-icon.svg';
import ChainBalances from './ChainBalances/ChainBalances';
import Crowdloans from './Crowdloans/Crowdloans';
import TransactionHistory from './TransactionHistory/TransactionHistory';
import ActionButton from './ActionButton';

interface WrapperProps extends ThemeProps {
  className?: string;
}

interface Props {
  className?: string;
  currentAccount: AccountJson;
  network: CurrentNetworkInfo;
  chainRegistryMap: Record<string, ChainRegistry>;
  historyMap: Record<string, TransactionHistoryItemType[]>;
}

function getTabHeaderItems (address: string, t: TFunction): TabHeaderItemType[] {
  const result = [
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
    }
  ];

  if (!isAccountAll(address)) {
    result.push({
      tabId: 5,
      label: t('Transfers'),
      lightIcon: transfers,
      darkIcon: transfers,
      activatedLightIcon: transfersActive,
      activatedDarkIcon: transfersActive
    });
  }

  return result;
}

function Wrapper ({ className, theme }: WrapperProps): React.ReactElement {
  const { hierarchy } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account: currentAccount },
    currentNetwork,
    transactionHistory: { historyMap } } = useSelector((state: RootState) => state);

  if (!hierarchy.length) {
    return (<AddAccount />);
  }

  if (!currentAccount) {
    return (<></>);
  }

  return (
    <Home
      chainRegistryMap={chainRegistryMap}
      className={className}
      currentAccount={currentAccount}
      historyMap={historyMap}
      network={currentNetwork}
    />
  );
}

let tooltipId = 0;

function Home ({ chainRegistryMap, className = '', currentAccount, historyMap, network }: Props): React.ReactElement {
  const { icon: iconTheme,
    networkKey,
    networkPrefix } = network;
  const { t } = useTranslation();
  const { address } = currentAccount;
  const [isShowBalanceDetail, setShowBalanceDetail] = useState<boolean>(false);
  const backupTabId = window.localStorage.getItem('homeActiveTab') || '1';
  const [activatedTab, setActivatedTab] = useState<number>(Number(backupTabId));
  const _setActiveTab = useCallback((tabId: number) => {
    window.localStorage.setItem('homeActiveTab', `${tabId}`);
    setActivatedTab(tabId);
    setShowBalanceDetail(false);
  }, []);
  const [isShowZeroBalances, setShowZeroBalances] = useState<boolean>(
    window.localStorage.getItem('show_zero_balances') === '1'
  );
  const [isQrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedNetworkBalance, setSelectedNetworkBalance] = useState<BigN>(BN_ZERO);
  const [trigger] = useState(() => `home-balances-${++tooltipId}`);
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
  const { accounts } = useContext(AccountContext);
  const { balanceStatus: { isShowBalance }, networkMetadata: networkMetadataMap } = useSelector((state: RootState) => state);
  const showedNetworks = useShowedNetworks(networkKey, address, accounts);
  const crowdloanNetworks = useCrowdloanNetworks(networkKey);

  const [nftPage, setNftPage] = useState(1);

  const [chosenNftCollection, setChosenNftCollection] = useState<_NftCollection>();
  const [showNftCollectionDetail, setShowNftCollectionDetail] = useState<boolean>(false);

  const [chosenNftItem, setChosenNftItem] = useState<_NftItem>();
  const [showNftItemDetail, setShowNftItemDetail] = useState<boolean>(false);

  const [showTransferredCollection, setShowTransferredCollection] = useState(false);
  const [showForcedCollection, setShowForcedCollection] = useState(false);

  const parseNftGridSize = useCallback(() => {
    if (window.innerHeight > NFT_GRID_HEIGHT_THRESHOLD) {
      const nftContainerHeight = window.innerHeight - NFT_HEADER_HEIGHT;
      const rowCount = Math.floor(nftContainerHeight / NFT_PREVIEW_HEIGHT);

      return rowCount * NFT_PER_ROW;
    } else {
      return NFT_DEFAULT_GRID_SIZE;
    }
  }, []);
  const nftGridSize = parseNftGridSize();
  const { loading: loadingNft, nftList, totalCollection, totalItems } = useFetchNft(nftPage, networkKey, nftGridSize);
  const { data: stakingData, loading: loadingStaking, priceMap: stakingPriceMap } = useFetchStaking(networkKey);

  const handleNftPage = useCallback((page: number) => {
    setNftPage(page);
  }, []);

  useEffect(() => {
    if (isAccountAll(address) && activatedTab === 5) {
      _setActiveTab(1);
    }
  }, [address, activatedTab, _setActiveTab]);

  const { crowdloanContributeMap,
    networkBalanceMaps,
    totalBalanceValue } = useAccountBalance(networkKey, showedNetworks, crowdloanNetworks);

  const _toggleZeroBalances = useCallback(() => {
    setShowZeroBalances((v) => {
      window.localStorage.setItem('show_zero_balances', v ? '0' : '1');

      return !v;
    });
  }, []);

  const _showQrModal = useCallback(() => {
    setQrModalProps({
      networkPrefix: networkPrefix,
      networkKey: networkKey,
      iconTheme: iconTheme,
      showExportButton: true
    });

    setQrModalOpen(true);
  }, [iconTheme, networkKey, networkPrefix]);

  const _closeQrModal = useCallback(() => {
    setQrModalOpen(false);
  }, []);

  const _isAccountAll = isAccountAll(address);

  const tabItems = useMemo<TabHeaderItemType[]>(() => {
    return getTabHeaderItems(address, t);
  }, [address, t]);

  const _toggleBalances = useCallback(() => {
    const accountInfo = {
      address: address,
      isShowBalance: !isShowBalance
    } as CurrentAccountInfo;

    saveCurrentAccountAddress(accountInfo, () => {
      triggerAccountsSubscription().catch((e) => {
        console.error('There is a problem when trigger Accounts Subscription', e);
      });
    }).catch((e) => {
      console.error('There is a problem when set Current Account', e);
    });
  }, [address, isShowBalance]);

  const _backToHome = useCallback(() => {
    setShowBalanceDetail(false);
  }, [setShowBalanceDetail]);

  const onChangeAccount = useCallback((address: string) => {
    setShowBalanceDetail(false);
  }, []);

  return (
    <div className={`home-screen home ${className}`}>
      <Header
        changeAccountCallback={onChangeAccount}
        className={'home-header'}
        isContainDetailHeader={true}
        isShowZeroBalances={isShowZeroBalances}
        setShowBalanceDetail={setShowBalanceDetail}
        showAdd
        showSearch
        showSettings
        text={t<string>('Accounts')}
        toggleZeroBalances={_toggleZeroBalances}
      />

      <div className={'home-action-block'}>
        <div className='account-total-balance'>
          <div
            className={'account-total-btn'}
            data-for={trigger}
            data-tip={true}
            onClick={_toggleBalances}
          >
            {isShowBalance
              ? <BalanceVal
                startWithSymbol
                symbol={'$'}
                value={isShowBalanceDetail ? selectedNetworkBalance : totalBalanceValue}
              />
              : <span>*********</span>
            }
          </div>
        </div>

        <div className='home-account-button-container'>
          {!_isAccountAll && (
            <div className='action-button-wrapper'>
              <ActionButton
                iconSrc={buyIcon}
                onClick={_showQrModal}
                tooltipContent={t<string>('Receive')}
              />
            </div>
          )}

          {_isAccountAll && (
            <div className='action-button-wrapper'>
              <ActionButton
                iconSrc={buyIcon}
                isDisabled
                tooltipContent={t<string>('Receive')}
              />
            </div>
          )}

          <Link
            className={'action-button-wrapper'}
            to={'/account/send-fund'}
          >
            <ActionButton
              iconSrc={sendIcon}
              tooltipContent={t<string>('Send')}
            />
          </Link>

          <Link
            className={'action-button-wrapper'}
            to={'/account/donate'}
          >
            <ActionButton
              iconSrc={donateIcon}
              tooltipContent={t<string>('Donate')}
            />
          </Link>
        </div>
      </div>

      {isShowBalanceDetail &&
        <div
          className='home__back-btn'
          onClick={_backToHome}
        >
          <FontAwesomeIcon
            className='home__back-icon'
            // @ts-ignore
            icon={faArrowLeft}
          />
          <span>{t<string>('Back to home')}</span>
        </div>
      }

      <div className={'home-tab-contents'}>
        {activatedTab === 1 && (
          <ChainBalances
            address={address}
            currentNetworkKey={networkKey}
            isShowBalanceDetail={isShowBalanceDetail}
            isShowZeroBalances={isShowZeroBalances}
            networkBalanceMaps={networkBalanceMaps}
            networkKeys={showedNetworks}
            networkMetadataMap={networkMetadataMap}
            setQrModalOpen={setQrModalOpen}
            setQrModalProps={setQrModalProps}
            setSelectedNetworkBalance={setSelectedNetworkBalance}
            setShowBalanceDetail={setShowBalanceDetail}
          />
        )}

        {activatedTab === 2 && (
          <NftContainer
            chosenCollection={chosenNftCollection}
            chosenItem={chosenNftItem}
            currentNetwork={networkKey}
            loading={loadingNft}
            nftGridSize={nftGridSize}
            nftList={nftList}
            page={nftPage}
            setChosenCollection={setChosenNftCollection}
            setChosenItem={setChosenNftItem}
            setPage={handleNftPage}
            setShowCollectionDetail={setShowNftCollectionDetail}
            setShowForcedCollection={setShowForcedCollection}
            setShowItemDetail={setShowNftItemDetail}
            setShowTransferredCollection={setShowTransferredCollection}
            showCollectionDetail={showNftCollectionDetail}
            showForcedCollection={showForcedCollection}
            showItemDetail={showNftItemDetail}
            showTransferredCollection={showTransferredCollection}
            totalCollection={totalCollection}
            totalItems={totalItems}
          />
        )}

        {activatedTab === 3 && (
          <Crowdloans
            crowdloanContributeMap={crowdloanContributeMap}
            networkKeys={crowdloanNetworks}
            networkMetadataMap={networkMetadataMap}
          />
        )}

        {activatedTab === 4 && (
          <StakingContainer
            data={stakingData}
            loading={loadingStaking}
            priceMap={stakingPriceMap}
          />
        )}

        {activatedTab === 5 && (
          <TransactionHistory
            historyMap={historyMap}
            networkKey={networkKey}
            registryMap={chainRegistryMap}
          />
        )}
      </div>

      <TabHeaders
        activatedItem={activatedTab}
        className={'home-tab-headers'}
        items={tabItems}
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

      <Tooltip
        offset={{ top: 8 }}
        text={isShowBalance ? 'Hide balance' : 'Show balance'}
        trigger={trigger}
      />
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

  .account-total-btn {
    width: fit-content;
    cursor: pointer;
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


  .home__back-btn {
    color: ${theme.buttonTextColor2};
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    margin-left: 25px;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .home__back-icon {
    padding-right: 7px;
  }

`));
