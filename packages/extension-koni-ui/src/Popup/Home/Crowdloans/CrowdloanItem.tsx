// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { TFunction } from 'react-i18next';
import styled from 'styled-components';

import { CrowdloanParaState } from '@polkadot/extension-base/background/KoniTypes';
import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { CrowdloanItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  item: CrowdloanItemType;
}

function getContainerClassName (item: CrowdloanItemType, extraClassName = ''): string {
  let className = `crowdloan-item ${extraClassName}`;

  if (!item.paraState) {
    return className;
  }

  if (item.paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
    className += ' -state-complete ';
  }

  if (item.paraState === CrowdloanParaState.FAILED.valueOf()) {
    className += ' -state-fail ';
  }

  if (item.paraState === CrowdloanParaState.ONGOING.valueOf()) {
    className += ' -state-ongoing ';
  }

  return className;
}

function getParaStateLabel (paraState: CrowdloanParaState, t: TFunction): string {
  if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
    return t('Winner');
  }

  if (paraState === CrowdloanParaState.FAILED.valueOf()) {
    return t('Fail');
  }

  if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
    return t('Active');
  }

  return '';
}

function CrowdloanItem ({ className, item }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={getContainerClassName(item, className)}>
      <div className='crowdloan-item__part-1'>
        <img
          alt='Logo'
          className='crowdloan-item__logo'
          src={item.logo}
        />

        <div className='crowdloan-item__meta-wrapper'>
          <div className='crowdloan-item__chain-top-area'>
            <div className='crowdloan-item__chain-name'>{item.networkDisplayName}</div>

            {!!item.paraState && (
              <div className={'crowdloan-item__status'}>{getParaStateLabel(item.paraState, t)}</div>
            )}
          </div>
          <div className='crowdloan-item__chain-group'>{item.groupDisplayName}</div>
        </div>
      </div>

      <div className='crowdloan-item__part-2'>
        <div className='crowdloan-item__contributed'>
          <BalanceVal
            symbol={item.symbol}
            value={item.contribute}
          />
        </div>
        <div className='crowdloan-item__contributed-to-usd'>
          <BalanceVal
            startWithSymbol
            symbol={'$'}
            value={item.contributeToUsd}
          />
        </div>
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
    left: 69px;
    right: 25px;
    height: 1px;
    display: block;
    bottom: 0;
    position: absolute;
    background: ${theme.boxBorderColor};
  }

  &.-state-complete {
    .crowdloan-item__status {
      color: ${theme.crowdloanWinnerStatus};
    }
  }

  &.-state-ongoing {
    .crowdloan-item__status {
      color: ${theme.crowdloanActiveStatus};
    }
  }

  &.-state-fail {
    .crowdloan-item__status {
      color: ${theme.crowdloanFailStatus};
    }
  }

  .crowdloan-item__part-1 {
    display: flex;
    align-items: center;
    flex: 1;
    padding-left: 25px;
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
    padding-right: 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .crowdloan-item__contributed .balance-val {
    color: ${theme.textColor};
    font-weight: 500;
  }

  .crowdloan-item__contributed-to-usd .balance-val {
    color: ${theme.textColor2};
    font-weight: 500;
  }
`);
