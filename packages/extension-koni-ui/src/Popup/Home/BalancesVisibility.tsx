// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BalanceVal } from '@subwallet/extension-koni-ui/components/balance';
import { toggleBalancesVisibility } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  isShowBalanceDetail: boolean;
  selectedNetworkBalance: BigN;
  totalBalanceValue: BigN;
}

let tooltipId = 0;

function BalancesVisibility ({ className, isShowBalanceDetail, selectedNetworkBalance, totalBalanceValue }: Props): React.ReactElement {
  const { settings: { isShowBalance } } = useSelector((state: RootState) => state);
  const [trigger] = useState(() => `balances-visibility-${++tooltipId}`);

  const _toggleBalances = useCallback(() => {
    toggleBalancesVisibility((value) => {
      console.log('Balances visible:', value.isShowBalance);
    }).catch((e) => {
      console.error('There is a problem when set Current Account', e);
    });
  }, []);

  return (
    <div
      className={className}
      data-for={trigger}
      data-tip={true}
      onClick={_toggleBalances}
    >
      {isShowBalance
        ? <BalanceVal
          startWithSymbol
          symbol={'$'}
          value={isShowBalanceDetail ? selectedNetworkBalance : totalBalanceValue}
        />
        : <span>*********</span>
      }
    </div>
  );
}

export default styled(BalancesVisibility)(({ theme }: Props) => `
  width: fit-content;
  cursor: pointer;
`);
