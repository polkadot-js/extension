// [object Object]
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import LogosMap from '@polkadot/extension-koni-ui/assets/logo';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import EmptyList from '@polkadot/extension-koni-ui/Popup/Home/Staking/EmptyList';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function StakingContainer ({ className }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  const { staking: stakingReducer } = useSelector((state: RootState) => state);

  const _onStateChange = (): void => {
    if (!stakingReducer?.ready) {
      setLoading(true);
      return;
    }

    // @ts-ignore
    setData(stakingReducer);
    setLoading(false);
  };

  useEffect(() => {
    _onStateChange();
  }, [stakingReducer]);

  const editBalance = (balance: string) => {
    if (parseInt(balance) === 0) return <span className={'major-balance'}>{balance}</span>;

    const balanceSplit = balance.split('.');

    return (
      <span>
        <span className={'major-balance'}>{balanceSplit[0]}</span>
        {balance.includes('.') && '.'}
        <span className={'decimal-balance'}>{balanceSplit[1]}</span>
      </span>
    );
  };

  const StakingRow = (logo: string, chainName: string, symbol: string, amount: string, unit: string, index: any) => {
    return (
      <div
        className={'staking-row'}
        key={index}
      >
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
    );
  };

  return (
    <div className={className}>
      <div className={'staking-container'}>
        {loading && <Spinner />}

        {/* @ts-ignore */}
        {data?.details.length === 0 && !loading &&
          <EmptyList />
        }

        {!loading && data &&
          // @ts-ignore
          data?.details.map((item: any, index: any) => {
            const name = item?.chainId;
            const icon = LogosMap[name];

            return StakingRow(icon, name, item.nativeToken, item.balance, item.unit, index);
          })
        }
      </div>
    </div>
  );
}

export default React.memo(styled(StakingContainer)(({ theme }: Props) => `
  width: 100%;
  padding: 0 25px;

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
    border-bottom: 1px solid ${theme.borderColor2};
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
    text-transform: capitalize;
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
`));
