// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
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
  let crowdloanStatusClass;

  if (item.crowdloanStatus === 'Winner') {
    crowdloanStatusClass = '-winner-status';
  } else if (item.crowdloanStatus === 'Fail') {
    crowdloanStatusClass = '-fail-status';
  } else {
    crowdloanStatusClass = '-active-status';
  }

  return (
    <div className={`crowdloan-item ${className || ''} ${crowdloanStatusClass}`}>
      <div className='crowdloan-item__part-1'>
        <img
          alt='Logo'
          className='crowdloan-item__logo'
          src={item.logo}
        />
        <div className='crowdloan-item__meta-wrapper'>
          <div className='crowdloan-item__chain-top-area'>
            <div className='crowdloan-item__chain-name'>{item.networkDisplayName}</div>
            <div className={'crowdloan-item__status'}>{item.crowdloanStatus}</div>
          </div>
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

  &.-winner-status {
    .crowdloan-item__status {
      color: ${theme.crowdloanWinnerStatus};
    }
  }

  &.-active-status {
    .crowdloan-item__status {
      color: ${theme.crowdloanActiveStatus};
    }
  }

  &.-fail-status {
    .crowdloan-item__status {
      color: ${theme.crowdloanFailStatus};
    }
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

  .crowdloan-item__chain-top-area {
    display: flex;
    align-items: center;
  }

  .crowdloan-item__status {
    padding: 2px 6px;
    border-radius: 3px;
    background-color: ${theme.backgroundAccountAddress};
    margin-left: 8px;
    font-size: 13px;
    line-height: 20px;
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
