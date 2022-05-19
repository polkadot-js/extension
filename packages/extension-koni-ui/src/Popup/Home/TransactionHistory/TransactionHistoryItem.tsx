// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import arrowReceived from '@subwallet/extension-koni-ui/assets/arrow-received.svg';
import arrowSend from '@subwallet/extension-koni-ui/assets/arrow-send.svg';
import arrowSendError from '@subwallet/extension-koni-ui/assets/arrow-send-error.svg';
import { BalanceVal } from '@subwallet/extension-koni-ui/components/balance';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getBalances, toShort } from '@subwallet/extension-koni-ui/util';
import { customFormatDate } from '@subwallet/extension-koni-ui/util/customFormatDate';
import React, { useState } from 'react';
import styled from 'styled-components';

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

type DecimalsAndSymbolInfo = {
  changeDecimals: number;
  changeSymbol: string;
  feeDecimals: number;
  feeSymbol: string;
}

function getDecimalsAndSymbolInfo (item: TransactionHistoryItemType, registry: ChainRegistry): DecimalsAndSymbolInfo {
  const result: DecimalsAndSymbolInfo = {} as DecimalsAndSymbolInfo;

  if (item.changeSymbol) {
    result.changeDecimals = registry.tokenMap[item.changeSymbol].decimals;
    result.changeSymbol = item.changeSymbol;
  } else {
    result.changeDecimals = registry.chainDecimals[0];
    result.changeSymbol = registry.chainTokens[0];
  }

  if (item.feeSymbol) {
    result.feeDecimals = registry.tokenMap[item.feeSymbol].decimals;
    result.feeSymbol = item.feeSymbol;
  } else {
    result.feeDecimals = registry.chainDecimals[0];
    result.feeSymbol = registry.chainTokens[0];
  }

  return result;
}

function TransactionHistoryItem ({ className,
  isSupportScanExplorer = false,
  item,
  registry }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [trigger] = useState(() => `transaction-history-item-${++tooltipId}`);
  const { changeDecimals,
    changeSymbol,
    feeDecimals,
    feeSymbol } = getDecimalsAndSymbolInfo(item, registry);

  const changeValue = getBalances({
    balance: item.change,
    decimals: changeDecimals,
    symbol: changeSymbol
  });

  const feeValue = getBalances({
    balance: item.fee || '',
    decimals: feeDecimals,
    symbol: feeSymbol
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
              symbol={changeSymbol}
              value={changeValue.balanceValue}
            />
          </div>

          {
            !!item.fee && (<div className='history-item__fee'>
              <span className={'history-item__fee-label'}>{t<string>('Fee:')}</span>
              <BalanceVal
                symbol={feeSymbol}
                value={feeValue.balanceValue}
              />
            </div>)
          }
        </div>
      </div>

      {!isSupportScanExplorer && (<Tooltip
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
    left: 25px;
    right: 25px;
    height: 1px;
    display: block;
    bottom: 0;
    position: absolute;
    background: ${theme.boxBorderColor};
  }

  .history-item__part-1 {
    display: flex;
    padding-left: 25px;
    align-items: center;
    flex: 1;
  }

  .history-item__part-2 {
    padding-right: 25px;
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
