// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceVal } from '@subwallet/extension-koni-ui/components/balance';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BalanceSubInfo } from '@subwallet/extension-koni-ui/util/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  item: BalanceSubInfo;
}

function ChainBalanceItemRow ({ className, item }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div className='chain-balance-item-row__col-1'>
        {t<string>(item.label)}
      </div>
      <div className='chain-balance-item-row__col-2'>
        <BalanceVal
          symbol={item.symbol}
          value={item.balanceValue}
        />
      </div>
      <div className='chain-balance-item-row__col-3'>
        <BalanceVal
          startWithSymbol
          symbol={'$'}
          value={item.convertedBalanceValue}
        />
      </div>
    </div>
  );
}

export default React.memo(styled(ChainBalanceItemRow)(({ theme }: Props) => `
  display: flex;

  .chain-balance-item-row__col-1,
  .chain-balance-item-row__col-2,
  .chain-balance-item-row__col-3 {
    flex: 0;
  }

  .chain-balance-item-row__col-1 {
    flex-grow: 4.3;
    max-width: 43%;
    padding-left: 69px;
    padding-right: 4px;
  }

  .chain-balance-item-row__col-2 {
    flex-grow: 2.85;
    max-width: 28.5%;
    padding-left: 4px;
    padding-right: 4px;
    text-align: right;
  }

  .chain-balance-item-row__col-3 {
    flex-grow: 2.85;
    max-width: 28.5%;
    padding-left: 4px;
    padding-right: 25px;
    text-align: right;
  }
`));
