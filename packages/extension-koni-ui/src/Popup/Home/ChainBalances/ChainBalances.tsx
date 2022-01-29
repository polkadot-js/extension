// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { Fragment } from 'react';
import styled from 'styled-components';

import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import ChainBalanceItem from '@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItem';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN_ZERO, getLogoByNetworkKey } from '@polkadot/extension-koni-ui/util';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';
import { AccountInfoByNetwork, BalanceInfo } from '@polkadot/extension-koni-ui/util/types';
import { NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';

interface Props extends ThemeProps {
  address: string;
  className?: string;
  currentNetworkKey: string;
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
}

function isAllowToShow (
  isShowZeroBalances: boolean,
  currentNetworkKey: string,
  networkKey: string,
  balanceInfo?: BalanceInfo): boolean {
  if (currentNetworkKey !== 'all' || ['polkadot', 'kusama'].includes(networkKey)) {
    return true;
  }

  return isShowZeroBalances
    || !!(balanceInfo && balanceInfo.balanceValue.gt(BN_ZERO));
}

function getAccountInfoByNetwork (
  address: string,
  networkKey: string,
  networkMetadata: NetWorkMetadataDef): AccountInfoByNetwork {

  return {
    key: networkKey,
    networkKey,
    networkDisplayName: networkMetadata.chain,
    networkPrefix: networkMetadata.ss58Format,
    networkLogo: getLogoByNetworkKey(networkKey),
    networkIconTheme: networkMetadata.isEthereum ? 'ethereum' : (networkMetadata.icon || 'polkadot'),
    address: reformatAddress(address, networkMetadata.ss58Format, networkMetadata.isEthereum)
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

function ChainBalances ({
                          address,
                          className,
                          setQrModalOpen,
                          setQrModalProps ,
                          networkKeys,
                          currentNetworkKey,
                          isShowZeroBalances,
                          networkMetadataMap,
                          networkBalanceMaps
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const accountInfoByNetworkMap: Record<string, AccountInfoByNetwork> =
    getAccountInfoByNetworkMap(address, networkKeys, networkMetadataMap);

  const renderChainBalanceItem = (networkKey: string) => {
    const info = accountInfoByNetworkMap[networkKey];
    const balanceInfo = networkBalanceMaps[networkKey];

    if (!isAllowToShow(
      isShowZeroBalances,
      currentNetworkKey,
      networkKey,
      balanceInfo
    )) {
      return (<Fragment key={info.key} />)
    }

    return (
      <ChainBalanceItem
        key={info.key}
        accountInfo={info}
        balanceInfo={balanceInfo}
        isLoading={!balanceInfo}
        setQrModalOpen={setQrModalOpen}
        setQrModalProps={setQrModalProps}
      />
    );
  };

  return (
    <div className={`chain-balances-container ${className? className : ''}`}>
      <div className='chain-balances-container__body'>
        {networkKeys.map((networkKey) => renderChainBalanceItem(networkKey))}
      </div>
      <div className='chain-balances-container__footer'>
        <div>
          <div className='chain-balances-container__footer-row-1'>
            {t<string>("Don't see your token?")}
          </div>
          <div className='chain-balances-container__footer-row-2'>
            <div className='chain-balances-container__footer-action'>{t<string>('Refresh list')}</div>
            <span>&nbsp;{t<string>('or')}&nbsp;</span>
            <div className='chain-balances-container__footer-action'>{t<string>('import tokens')}</div>
          </div>
        </div>
      </div>
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
    display: none;
  }

  .chain-balances-container__footer-row-2 {
    display: flex;
  }

  .chain-balances-container__footer-row-2 {
    display: flex;
  }

  .chain-balances-container__footer-action {
    color: ${theme.buttonTextColor2};
    cursor: pointer;
  }
`));
