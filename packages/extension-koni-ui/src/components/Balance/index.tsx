// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface BalanceViewProps extends ThemeProps {
  className?: string;
  value: string | BigN;
  symbol?: string;
  startWithSymbol?: boolean;
  withComma?: boolean;
  withSymbol?: boolean;
  newRule?: boolean;
}

const BalanceValComponent = ({ className, newRule = true, startWithSymbol = false, symbol, value, withComma = true, withSymbol = true }: BalanceViewProps) => {
  let [prefix, postfix] = typeof value === 'object' ? value.toFormat(9).split('.') : value.toString().split('.');
  const length = newRule ? (parseFloat(prefix) >= 1 ? 2 : 4) : 4;

  if (startWithSymbol) {
    postfix = postfix?.substring(0, length - 1);
  } else {
    postfix = postfix?.substring(0, length);
  }

  const lastSymbol = postfix?.slice(-1);
  const isString = /^[KMB]/.test(lastSymbol);

  const postfixValue = parseInt(postfix) > 0 ? postfix : '00';

  const symbolView = prefix && <span className='balance-val__symbol'>{symbol}</span>;

  return (
    <span className={CN(className, 'balance-val')}>
      {startWithSymbol && withSymbol && symbolView}<span className='balance-val__prefix'>{prefix}</span>

      .<span className='balance-val__postfix'>
        {isString ? postfixValue.slice(0, -1) : postfixValue}
      </span>
      {isString && lastSymbol}
      <> {!startWithSymbol && withSymbol && symbolView}</>
    </span>
  );
};

export const BalanceVal = React.memo(styled(BalanceValComponent)(({ theme }: BalanceViewProps) => `
  .balance-val__postfix {
    opacity: ${theme.textOpacity};
  }
`));
