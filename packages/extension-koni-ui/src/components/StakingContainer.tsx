import {AccountJson} from "@polkadot/extension-base/background/types";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import React, {useCallback, useEffect, useState} from "react";
import LogosMap from "@polkadot/extension-koni-ui/assets/logo";
import {useSelector} from "react-redux";
import {RootState} from "@polkadot/extension-koni-ui/stores";
import {getStaking} from "@polkadot/extension-koni-ui/messaging";
import Spinner from "@polkadot/extension-koni-ui/components/Spinner";

interface Props extends AccountJson {
  className?: string;
}


function StakingContainer ({className}: Props): React.ReactElement<Props> {
  const currentAccount = useSelector((state: RootState) => state.currentAccount)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState()
  const _onCreate = useCallback(
    async (): void => {
      if (currentAccount && currentAccount.address) {
        setLoading(true)
        const resp = await getStaking(currentAccount.address)
        setData(resp)
        setLoading(false)
      } else {
        console.error('There is a problem getting staking')
      }
    },
    [currentAccount]
  );

  useEffect(() => {
    _onCreate()
  }, [currentAccount])

  const editBalance = (balance: string) => {
    if (parseInt(balance) === 0) return <span className={`major-balance`}>{balance}</span>

    const balanceSplit = balance.split('.')
    return (
      <span>
        <span className={'major-balance'}>{balanceSplit[0]}</span>
        {balance.includes('.') && '.'}
        <span className={'decimal-balance'}>{balanceSplit[1]}</span>
      </span>
    )
  }

  const StakingRow = (logo: string, chainName: string, symbol: string, amount: string, unit: string) => {
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
        {loading && <Spinner/>}

        {!loading && data &&
          data?.details.map((item: any, index: any) => {
            const name = item?.paraId
            const icon = LogosMap[name]
            return StakingRow(icon, name, item.nativeToken, item.balance, item.unit)
          })
        }
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
