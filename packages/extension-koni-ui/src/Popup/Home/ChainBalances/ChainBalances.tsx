// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';
import { Link } from '@polkadot/extension-koni-ui/components';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import ChainBalanceDetailItem from '@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceDetail/ChainBalanceDetailItem';
import ChainBalanceItem from '@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItem';
import { hasAnyChildTokenBalance } from '@polkadot/extension-koni-ui/Popup/Home/ChainBalances/utils';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN_ZERO, getLogoByNetworkKey } from '@polkadot/extension-koni-ui/util';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';
import { AccountInfoByNetwork, BalanceInfo } from '@polkadot/extension-koni-ui/util/types';

import ChainBalanceDetail from '../ChainBalances/ChainBalanceDetail/ChainBalanceDetail';

interface Props extends ThemeProps {
  address: string;
  className?: string;
  currentNetworkKey: string;
  isShowBalanceDetail: boolean;
  isShowZeroBalances: boolean;
  networkKeys: string[];
  networkBalanceMaps: Record<string, BalanceInfo>;
  networkMetadataMap: Record<string, NetWorkMetadataDef>;
  setQrModalOpen: (visible: boolean) => void;
  setQrModalProps: (props: {
    networkPrefix: number,
    networkKey: string,
    iconTheme: string,
    showExportButton: boolean
  }) => void;
  setShowBalanceDetail: (isShowBalanceDetail: boolean) => void;
  setSelectedNetworkBalance?: (networkBalance: BigN) => void;
}

function isAllowToShow (
  isShowZeroBalances: boolean,
  currentNetworkKey: string,
  networkKey: string,
  balanceInfo?: BalanceInfo): boolean {
  if (currentNetworkKey !== 'all' || ['polkadot', 'kusama'].includes(networkKey)) {
    return true;
  }

  return isShowZeroBalances ||
    !!(balanceInfo &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (balanceInfo.balanceValue.gt(BN_ZERO) || hasAnyChildTokenBalance(balanceInfo)));
}

function getAccountInfoByNetwork (
  address: string,
  networkKey: string,
  networkMetadata: NetWorkMetadataDef): AccountInfoByNetwork {
  return {
    address,
    key: networkKey,
    networkKey,
    networkDisplayName: networkMetadata.chain,
    networkPrefix: networkMetadata.ss58Format,
    networkLogo: getLogoByNetworkKey(networkKey),
    networkIconTheme: networkMetadata.isEthereum ? 'ethereum' : (networkMetadata.icon || 'polkadot'),
    formattedAddress: reformatAddress(address, networkMetadata.ss58Format, networkMetadata.isEthereum)
  };
}

function getAccountInfoByNetworkMap (
  address: string,
  networkKeys: string[],
  networkMetadataMap: Record<string, NetWorkMetadataDef>): Record<string, AccountInfoByNetwork> {
  const result: Record<string, AccountInfoByNetwork> = {};

  networkKeys.forEach((n) => {
    if (networkMetadataMap[n]) {
      result[n] = getAccountInfoByNetwork(address, n, networkMetadataMap[n]);
    }
  });

  return result;
}

function ChainBalances ({ address,
  className,
  currentNetworkKey,
  isShowBalanceDetail,
  isShowZeroBalances,
  networkBalanceMaps,
  networkKeys,
  networkMetadataMap,
  setQrModalOpen,
  setQrModalProps,
  setSelectedNetworkBalance,
  setShowBalanceDetail }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const accountInfoByNetworkMap: Record<string, AccountInfoByNetwork> =
    getAccountInfoByNetworkMap(address, networkKeys, networkMetadataMap);
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>('');
  const [scrollWidth, setScrollWidth] = useState<number>(6);
  const [containerWidth, setContainerWidth] = useState<number>(458);
  const [listWidth, setListWidth] = useState<number>(452);
  const selectedInfo = accountInfoByNetworkMap[selectedNetworkKey];
  const selectedBalanceInfo = networkBalanceMaps[selectedNetworkKey];

  const _openBalanceDetail = useCallback((networkKey: string) => {
    setSelectedNetworkKey(networkKey);
    setShowBalanceDetail(true);
  }, [setShowBalanceDetail]);

  const toggleBalanceDetail = useCallback((networkKey: string) => {
    if (networkKey === selectedNetworkKey) {
      setSelectedNetworkKey('');
    } else {
      setSelectedNetworkKey(networkKey);
    }
  }, [selectedNetworkKey]);

  const renderChainBalanceItem = (networkKey: string) => {
    const info = accountInfoByNetworkMap[networkKey];
    const balanceInfo = networkBalanceMaps[networkKey];

    if (!isAllowToShow(
      isShowZeroBalances,
      currentNetworkKey,
      networkKey,
      balanceInfo
    )) {
      return (<Fragment key={info.key} />);
    }

    if (balanceInfo && balanceInfo.childrenBalances.length === 0) {
      return (
        <ChainBalanceDetailItem
          accountInfo={info}
          balanceInfo={balanceInfo}
          isLoading={!balanceInfo}
          isShowDetail={info.networkKey === selectedNetworkKey}
          key={info.key}
          setQrModalOpen={setQrModalOpen}
          setQrModalProps={setQrModalProps}
          toggleBalanceDetail={toggleBalanceDetail}
        />
      );
    }

    return (
      <ChainBalanceItem
        accountInfo={info}
        balanceInfo={balanceInfo}
        isLoading={!balanceInfo}
        key={info.key}
        setQrModalOpen={setQrModalOpen}
        setQrModalProps={setQrModalProps}
        setSelectedNetworkBalance={setSelectedNetworkBalance}
        showBalanceDetail={_openBalanceDetail}
      />
    );
  };

  const getScrollbarWidth = () => {
    // Creating invisible container
    const outer = document.createElement('div');

    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    // @ts-ignore
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);
    // Creating inner element and placing it in the container
    const inner = document.createElement('div');

    outer.appendChild(inner);
    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    document.body.removeChild(outer);
    setScrollWidth(scrollbarWidth);
  };

  const handlerResize = () => {
    const container = document.querySelector('.home-tab-contents') as HTMLElement;

    setContainerWidth(container.offsetWidth);
  };

  useEffect(() => {
    handlerResize();
    window.addEventListener('resize', handlerResize);
  }, []);

  useEffect(() => {
    getScrollbarWidth();
  }, []);

  useEffect(() => {
    setListWidth(containerWidth - scrollWidth);
  }, [containerWidth, scrollWidth]);

  return (
    <div className={CN(className, 'chain-balances-container')}>
      {!isShowBalanceDetail || !selectedNetworkKey || !selectedInfo || !selectedBalanceInfo
        ? (
          <>
            <div
              className={CN('chain-balances-container__body')}
              style={{ width: listWidth }}
            >
              {networkKeys.map((networkKey) => renderChainBalanceItem(networkKey))}
            </div>
            <div className='chain-balances-container__footer'>
              <div>
                <div className='chain-balances-container__footer-row-1'>
                  {t<string>("Don't see your token?")}
                </div>
                <div className='chain-balances-container__footer-row-2'>
                  {/* <div className='chain-balances-container__footer-action'>{t<string>('Refresh list')}</div> */}
                  {/* <span>&nbsp;{t<string>('or')}&nbsp;</span> */}
                  <Link
                    className='chain-balances-container__footer-action'
                    to={'/account/import-evm-token'}
                  >
                    {t<string>('Import tokens')}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )
        : (
          <>
            <ChainBalanceDetail
              accountInfo={selectedInfo}
              balanceInfo={selectedBalanceInfo}
              setQrModalOpen={setQrModalOpen}
              setQrModalProps={setQrModalProps}
            />
          </>
        )
      }

    </div>
  );
}

export default React.memo(styled(ChainBalances)(({ theme }: Props) => `
  .chain-balances-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 100%;
  }

  .chain-balances-container__body {
    overflow-y: auto;
  }

  .chain-balances-container__footer {
    height: 90px;
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;
    color: ${theme.textColor2};
    font-size: 14px;
  }

  .chain-balances-container__footer-row-2 {
    display: flex;
    justify-content: center;

  }

  .chain-balances-container__footer-action {
    color: ${theme.buttonTextColor2};
    cursor: pointer;
  }
`));
