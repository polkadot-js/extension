import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import ChainBalanceItem from "@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItem";
import {AccountInfoByNetwork, BalanceInfo} from "@polkadot/extension-koni-ui/util/types";
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import React from "react";
import styled from "styled-components";
import {getLogoByNetworkKey} from "@polkadot/extension-koni-ui/util";
import reformatAddress from "@polkadot/extension-koni-ui/util/reformatAddress";
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import BigN from "bignumber.js";

interface Props extends ThemeProps {
  address: string;
  className?: string;
  setQrModalOpen: (visible: boolean) => void;
  setQrModalProps: (props: {
    networkPrefix: number,
    networkKey: string,
    iconTheme: string,
    showExportButton: boolean
  }) => void;
}

function getAccountInfoByNetwork(address: string, networkKey: string): AccountInfoByNetwork {
  const networkInfo = NETWORKS[networkKey];

  return {
    key: networkKey,
    networkKey,
    networkDisplayName: networkInfo.chain,
    networkPrefix: networkInfo.ss58Format,
    networkLogo: getLogoByNetworkKey(networkKey),
    networkIconTheme: networkInfo.isEthereum ? 'ethereum' : (networkInfo.icon || 'polkadot'),
    address: reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum)
    // address: ''
  }
}

function getAccountInfoByNetworkMap(address: string, networkKeys: string[]): Record<string, AccountInfoByNetwork> {
  const result: Record<string, AccountInfoByNetwork> = {};

  networkKeys.forEach(n => {
    result[n] = getAccountInfoByNetwork(address, n);
  });

  return result;
}

function getMockChainBalanceMaps(networkKeys: string[]): Record<string, BalanceInfo> {
  const result: Record<string, BalanceInfo> = {};

  networkKeys.forEach(n => {
    result[n] = {
      balanceValue: new BigN(100),
      convertedBalanceValue: new BigN(100),
      childrenBalances: [
        {
          key: 'free',
          label: 'Transferable',
          symbol: 'Unit',
          convertedBalanceValue: new BigN(100),
          balanceValue: new BigN(100)
        },
        {
          key: 'reserved',
          label: 'Reserved balance',
          symbol: 'Unit',
          convertedBalanceValue: new BigN(0),
          balanceValue: new BigN(0)
        },
        {
          key: 'locked',
          label: 'Locked balance',
          symbol: 'Unit',
          convertedBalanceValue: new BigN(0),
          balanceValue: new BigN(0)
        },
        {
          key: 'frozen',
          label: 'Frozen fee',
          symbol: 'Unit',
          convertedBalanceValue: new BigN(0),
          balanceValue: new BigN(0)
        },
      ],
      detailBalances: [],
      symbol: "Unit"
    };
  });

  return result;
}

function ChainBalances({className, setQrModalOpen, setQrModalProps, address}: Props): React.ReactElement<Props> {
  const {t} = useTranslation();
  const networks: string[] = [
    'polkadot',
    'kusama',
    'koni',
    'statemint',
    'acala',
    'moonbeam',
    'astar',
    'parallel',
    'clover',
    'hydradx',
  ];
  const accountInfoByNetworkMap: Record<string, AccountInfoByNetwork> = getAccountInfoByNetworkMap(address, networks);
  const chainBalanceMaps: Record<string, BalanceInfo> = getMockChainBalanceMaps(networks);

  const renderChainBalanceItem = (network: string) => {
    const info = accountInfoByNetworkMap[network];
    const balanceInfo = chainBalanceMaps[network];

    return (
      <ChainBalanceItem
        accountInfo={info} key={info.key}
        balanceInfo={balanceInfo}
        setQrModalProps={setQrModalProps}
        setQrModalOpen={setQrModalOpen}
      />
    );
  };

  return (
    <div className={`chain-balances-container ${className}`}>
      <div className="chain-balances-container__body">
        {networks.map((network) => renderChainBalanceItem(network))}
      </div>
      <div className="chain-balances-container__footer">
        <div>
          <div className="chain-balances-container__footer-row-1">
            {t<string>("Don't see your token?")}
          </div>
          <div className="chain-balances-container__footer-row-2">
            <div className="chain-balances-container__footer-action">{t<string>("Refresh list")}</div>
            <span>&nbsp;{t<string>("or")}&nbsp;</span>
            <div className="chain-balances-container__footer-action">{t<string>("import tokens")}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(styled(ChainBalances)(({theme}: Props) => `
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
