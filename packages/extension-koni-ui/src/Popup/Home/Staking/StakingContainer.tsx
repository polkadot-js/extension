// [object Object]
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { StakingJson } from '@polkadot/extension-base/background/KoniTypes';
import LogosMap from '@polkadot/extension-koni-ui/assets/logo';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import EmptyList from '@polkadot/extension-koni-ui/Popup/Home/Staking/EmptyList';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  loading: boolean;
  data: StakingJson;
}

function StakingContainer ({ className, data, loading }: Props): React.ReactElement<Props> {
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
            const icon = LogosMap[name] || LogosMap.default;

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
    min-width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    margin-right: 12px;
    background-color: #fff;
    border: 1px solid #fff;
    margin-top:10px;
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
