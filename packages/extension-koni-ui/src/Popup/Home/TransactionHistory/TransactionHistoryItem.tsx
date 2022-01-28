// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import styled from 'styled-components';

import { TransactionHistoryItemType } from '@polkadot/extension-base/background/types';
import { ChainRegistry } from '@polkadot/extension-koni-base/api/types';
import arrowReceived from '@polkadot/extension-koni-ui/assets/arrow-received.svg';
import arrowSend from '@polkadot/extension-koni-ui/assets/arrow-send.svg';
import arrowSendError from '@polkadot/extension-koni-ui/assets/arrow-send-error.svg';
import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import Tooltip from '@polkadot/extension-koni-ui/components/Tooltip';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getBalances, toShort } from '@polkadot/extension-koni-ui/util';
import { customFormatDate } from '@polkadot/extension-koni-ui/util/customFormatDate';

interface Props extends ThemeProps {
  className?: string;
  item: TransactionHistoryItemType;
  registry: ChainRegistry;
  isSupportScanExplorer: boolean;
}

let tooltipId = 0;

function getContainerClassName (item: TransactionHistoryItemType, extraClass = '') {
  let className = `history-item ${extraClass}`;

  if (item.action === 'received') {
    className += ' -received ';
  } else if (item.action === 'send') {
    className += ' -send ';
  }

  if (!item.isSuccess) {
    className += ' -error ';
  }

  return className;
}

function TransactionHistoryItem ({ className,
  isSupportScanExplorer = true,
  item,
  registry }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [trigger] = useState(() => `transaction-history-item-${++tooltipId}`);
  const transactionValue = getBalances({
    balance: item.change,
    decimals: registry.chainDecimals[0],
    symbol: registry.chainTokens[0],
    tokenPrices: [],
    priceField: '',
    comparableValue: ''
  });

  const transactionFee = getBalances({
    balance: item.fee || '',
    decimals: registry.chainDecimals[0],
    symbol: registry.chainTokens[0],
    tokenPrices: [],
    priceField: '',
    comparableValue: ''
  });

  const containerClassName = getContainerClassName(item, className);

  return (
    <>
      <div
        className={containerClassName}
        data-for={trigger}
        data-tip={true}
      >
        <div className='history-item__part-1'>
          <div className='history-item__img-wrapper'>
            {item.action === 'received'
              ? <img
                alt='Received'
                className='history-item__img'
                src={arrowReceived}
              />
              : <>
                {item.isSuccess
                  ? <img
                    alt='Send'
                    className='history-item__img'
                    src={arrowSend}
                  />
                  : <img
                    alt='Send error'
                    className='history-item__img'
                    src={arrowSendError}
                  />
                }
              </>
            }
          </div>

          <div className='history-item__meta-wrapper'>
            <div className='history-item__meta-item-1 history-item__name'>
              {toShort(item.extrinsicHash, 6, 4)}
            </div>

            <div className='history-item__meta-item-2'>
              <span className='history-item__action-name'>{item.action}</span>
              <span className='history-item__date'>{customFormatDate(item.time, '#MMM# #DD#')}</span>
            </div>
          </div>
        </div>

        <div className='history-item__part-2'>
          <div className='history-item__value'>
            <span>{item.action === 'received' ? '+' : '-'}</span>

            <BalanceVal
              symbol={registry.chainTokens[0]}
              value={transactionValue.balanceValue}
            />
          </div>

          {
            !!item.fee && (<div className='history-item__fee'>
              <span className={'history-item__fee-label'}>{t<string>('Fee:')}</span>
              <BalanceVal
                symbol={registry.chainTokens[0]}
                value={transactionFee.balanceValue}
              />
            </div>)
          }
        </div>
      </div>

      {isSupportScanExplorer && (<Tooltip
        text={t<string>('You can\'t view this transaction because it isn\'t supported on Subscan')}
        trigger={trigger}
      />)}
    </>
  );
}

export default React.memo(styled(TransactionHistoryItem)(({ theme }: Props) => `
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 0;

  &:before {
    content: '';
    left: 15px;
    right: 15px;
    bottom: 0;
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .history-item__part-1 {
    display: flex;
    padding-left: 15px;
    align-items: center;
    flex: 1;
  }

  .history-item__part-2 {
    padding-right: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .history-item__img-wrapper {
    border: 2px solid;
    border-radius: 40%;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 14px;
  }

  &.-received .history-item__img-wrapper {
    border-color: rgba(102, 225, 182, 0.3);
  }

  &.-send .history-item__img-wrapper {
    border-color: rgba(0, 75, 255, 0.3);
  }

  &.-error .history-item__img-wrapper {
    border-color: rgba(175, 17, 17, 0.3);
  }

  .history-item__img {
    width: 20px;
  }

  .history-item__name {
    font-size: 17px;
    line-height: 30px;
    font-weight: 500;
  }

  .history-item__action-name {
    font-size: 15px;
    line-height: 24px;
    color: ${theme.textColor2};
    text-transform: capitalize;
  }

  .history-item__date {
    font-size: 15px;
    line-height: 24px;
    color: ${theme.textColor2};
    position: relative;
    padding-left: 17px;
  }

  .history-item__date:before {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${theme.textColor2};
    top: 0;
    bottom: 0;
    left: 7px;
    margin: auto 0;
  }

  .history-item__value, .history-item__fee {
    text-align: right;
    font-size: 15px;
    line-height: 26px;
    display: flex;
    justify-content: flex-end;
  }

  .history-item__value {
    font-weight: 500;
    padding-bottom: 3px;
  }

  .history-item__fee {
    color: ${theme.textColor2};
  }

  .history-item__fee-label {
    margin-right: 4px;
  }
`));
