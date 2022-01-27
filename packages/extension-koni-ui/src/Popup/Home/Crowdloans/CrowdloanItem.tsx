// [object Object]
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import { CrowdloanItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  item: CrowdloanItemType;
}

function CrowdloanItem ({ className, item }: Props): React.ReactElement<Props> {
  return (
    <div className={`crowdloan-item ${className}`}>
      <div className='crowdloan-item__part-1'>
        <img
          alt='Logo'
          className='crowdloan-item__logo'
          src={item.logo}
        />
        <div className='crowdloan-item__meta-wrapper'>
          <div className='crowdloan-item__chain-name'>{item.networkDisplayName}</div>
          <div className='crowdloan-item__chain-group'>{item.groupDisplayName}</div>
        </div>
      </div>
      <div className='crowdloan-item__part-2'>
        <BalanceVal
          symbol={item.symbol}
          value={item.contribute}
        />
        <BalanceVal
          startWithSymbol
          symbol={'$'}
          value={item.contributeToUsd}
        />
      </div>
    </div>
  );
}

export default styled(CrowdloanItem)(({ theme }: Props) => `
  display: flex;
  align-item: center;
  padding: 10px 0;
  position: relative;

  &:before {
    content: '';
    left: 15px;
    right: 15px;
    height: 1px;
    display: block;
    bottom: 0;
    position: absolute;
    background: ${theme.boxBorderColor};
  }

  .crowdloan-item__part-1 {
    display: flex;
    align-items: center;
    flex: 1;
    padding-left: 15px;
  }

  .crowdloan-item__logo {
    min-width: 32px;
    width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    margin-right: 12px;
    background-color: #fff;
    border: 1px solid #fff;
  }

  .crowdloan-item__chain-name, .crowdloan-item__part-2 .kn-balance-val:first-child {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor};
  }

  .crowdloan-item__chain-name {
    font-size: 17px;
  }

  .crowdloan-item__chain-group, .crowdloan-item__part-2 .kn-balance-val:last-child {
    font-size: 14px;
    line-height: 24px;
    color: ${theme.textColor2};
  }

  .crowdloan-item__part-2 {
    text-align: right;
    padding-right: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`);
