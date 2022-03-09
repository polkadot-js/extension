// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import ChainBalanceItemRow from '@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItemRow';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { AccountInfoByNetwork, BalanceInfo } from '@polkadot/extension-koni-ui/util/types';

import acala from '../../../../assets/logo/acala.svg';
import { Loading } from '../../../../components';

interface Props extends ThemeProps {
  className?: string;
  accountInfo: AccountInfoByNetwork;
  balanceInfo: BalanceInfo;
  isLoading: boolean;
}

function ChainBalanceChildrenItem ({ accountInfo, balanceInfo, className, isLoading }: Props): React.ReactElement<Props> {
  const [toggleDetail, setToggleDetail] = useState(false);

  const _onToggleDetail = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setToggleDetail((toggleDetail) => !toggleDetail);
  }, []);

  const mockDetailData = [
    { key: 'free', label: 'Transferable', symbol: 'DOT', convertedBalanceValue: new BigN('0'), balanceValue: new BigN('0') },
    { key: 'reserved', label: 'Reserved balance', symbol: 'DOT', convertedBalanceValue: new BigN('0'), balanceValue: new BigN('0') },
    { key: 'locked', label: 'Locked balance', symbol: 'DOT', convertedBalanceValue: new BigN('0'), balanceValue: new BigN('0') },
    { key: 'frozen', label: 'Frozen fee', symbol: 'DOT', convertedBalanceValue: new BigN('0'), balanceValue: new BigN('0') }
  ];

  return (
    <div
      className={`${className || ''} ${toggleDetail ? '-show-detail' : ''}`}
      onClick={_onToggleDetail}
    >
      <div className='chain-balance--children-item__main-area'>
        <div className='chain-balance--children-item__main-area-part-1'>
          <img
            alt={'Logo'}
            className='chain-balance--children-item__logo'
            src={acala}
          />

          <div className='chain-balance--children-item__meta-wrapper'>
            <div className='chain-balance--children-item__chain-name'>{'Acala Demo'}</div>
          </div>
        </div>

        {isLoading && (
          <div className='chain-balance--children-item__main-area-part-2'>
            <Loading />
          </div>
        )}

        {!isLoading && (
          <div className='chain-balance--children-item__main-area-part-2'>
            <div className='chain-balance--children-item__balance'>
              <BalanceVal
                symbol={'ACA'}
                value={new BigN('0')}
              />
            </div>
            <div className='chain-balance--children-item__value'>
              <BalanceVal
                startWithSymbol
                symbol={'$'}
                value={new BigN('0')}
              />
            </div>

            {(!!mockDetailData.length || !!mockDetailData.length) && (
              <div className='chain-balance--children-item__toggle' />
            )}
          </div>
        )}
      </div>

      {!isLoading && toggleDetail && !!mockDetailData.length && (
        <>
          <div className='chain-balance--children-item__separator' />
          <div className='chain-balance--children-item__detail-area'>
            {mockDetailData.map((d) => (
              <ChainBalanceItemRow
                item={d}
                key={d.key}
              />
            ))}

          </div>
        </>
      )}
      <div className='chain-balance--children-item__separator' />
    </div>
  );
}

export default React.memo(styled(ChainBalanceChildrenItem)(({ theme }: Props) => `
  //border: 2px solid ${theme.boxBorderColor};
  border-radius: 8px;
  color: ${theme.textColor2};
  // font-weight: 500;

  .chain-balance--children-item__main-area {
    display: flex;
    align-items: center;
    font-size: 15px;
  }

  .chain-balance--children-item__main-area {
    display: flex;
    font-size: 15px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .chain-balance--children-item__detail-area,
  .chain-balance--children-item__detail-area {
    font-size: 14px;
    padding-top: 8px;
    padding-bottom: 10px;
  }

  .chain-balance--children-item__main-area-part-1 {
    flex: 1;
    display: flex;
    overflow: hidden;
    padding-left: 25px;
  }

  .chain-balance--children-item__main-area-part-2 {
    position: relative;
    padding-right: 48px;
    text-align: right;
    cursor: pointer;
    min-width: 80px;

    .loading-img.loading-img {
      width: 32px;
      height: 32px;
      border-width: 4px;
      border-color: transparent;
      border-left-color: ${theme.textColor2};
      display: block;
    }
  }

  .chain-balance--children-item__logo {
    min-width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    margin-right: 12px;
    background-color: #fff;
    border: 1px solid #fff;
    margin-top:10px;
  }

  .chain-balance--children-item__meta-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .chain-balance--children-item__chain-name {
    font-weight: 500;
    font-size: 16px;
  }

  .chain-balance--children-item__bottom-area {
    display: flex;
    align-items: center;
  }

  .chain-balance--children-item__address {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .chain-balance--children-item__address-text {
    flex: 1;
    margin-right: 6px;
    font-weight: 400;
    min-width: 126px;
  }

  .chain-balance--children-item__copy {
    min-width: 20px;
    height: 20px;
  }

  .chain-balance--children-item__receive {
    min-width: 16px;
    height: 16px;
    margin-left: 12px;
    cursor: pointer;
  }

  .chain-balance--children-item__toggle {
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(45deg);
    top: 7px;
    right: 25px;
  }

  .chain-balance--children-item__chain-name,
  .balance-val__symbol,
  .balance-val__prefix {
    color: ${theme.textColor};
  }

  .balance-val {
    font-weight: 500;
  }

  .chain-balance--children-item__separator {
    padding-left: 69px;
    padding-right: 25px;

    &:before {
      content: '';
      height: 1px;
      display: block;
      background: ${theme.boxBorderColor};
    }
  }

  &.-show-detail .chain-balance--children-item__toggle {
    top: 9px;
    transform: rotate(-135deg);
  }
`));
