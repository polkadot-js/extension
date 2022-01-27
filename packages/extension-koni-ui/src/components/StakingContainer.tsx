import {AccountJson} from "@polkadot/extension-base/background/types";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import React from "react";
import LogosMap from "@polkadot/extension-koni-ui/assets/logo";

interface Props extends AccountJson {
  className?: string;
}


function StakingContainer ({className}: Props): React.ReactElement<Props> {
  const editBalance = (balance: Number) => {
    if (balance === 0) return <span className={`major-balance`}>{balance}</span>

    const balanceSplit = balance.toString().split('.')
    return (
      <span>
        <span className={'major-balance'}>{balanceSplit[0]}</span>
        .
        <span className={'decimal-balance'}>{balanceSplit[1]}</span>
      </span>
    )
  }

  const StakingRow = (logo: string, chainName: string, symbol: string, amount: Number, unit: string) => {
    return (
      <div className={`staking-row`}>
        <img
          alt='logo'
          className={'network-logo'}
          src={logo}
        />
        <div className={'info-wrapper'}>
          <div className={'meta-container'}>
            <div className={'chain-name'}>{chainName}</div>
            <div className={'chain-symbol'}>{symbol}</div>
          </div>

          <div className={'meta-container'}>
            <div className={'staking-amount'}>{editBalance(amount)}</div>
            <div className={'chain-unit'}>{unit}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className={`staking-container`}>
        {StakingRow(LogosMap.clover, 'Moonbeam', 'Dot', 0, 'DOT')}
        {StakingRow(LogosMap.polkadot, 'Polkadot', 'Dot', 100.05128398, 'DOT')}
        {StakingRow(LogosMap.kusama, 'Kusama', 'Dot', 0.00128398, 'DOT')}
      </div>
    </div>
  )
}

export default styled(StakingContainer)(({ theme }: ThemeProps) => `
  width: 100%;

  .staking-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .staking-row {
    width: 100%;
    display: flex;
    gap: 12px;
  }

  .network-logo {
    display: block;
    width: 56px;
    height: 56px;
    border-radius: 15px;
  }

  .info-wrapper {
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #212845;
    padding-bottom: 20px;
  }

  .meta-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .chain-name {
    font-size: 16px;
    font-weight: 500;
  }

  .chain-symbol {
    text-transform: uppercase;
    font-size: 14px;
    color: #7B8098;
  }

  .staking-amount {
    font-size: 15px;
    font-weight: 500;
    display: flex;
    justify-content: flex-end;
  }

  .chain-unit {
    text-transform: uppercase;
    font-size: 14px;
    font-weight: normal;
    display: flex;
    justify-content: flex-end;
    color: #7B8098;
  }

  .major-balance {}

  .decimal-balance {
    color: #7B8098;
  }
`);
