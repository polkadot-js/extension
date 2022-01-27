// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BalanceSubInfo } from '@polkadot/extension-koni-ui/util/types';

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
    flex-grow: 4.18;
    max-width: 41.8%;
    padding-left: 69px;
    padding-right: 7.5px;
  }

  .chain-balance-item-row__col-2 {
    flex-grow: 2.91;
    max-width: 29.1%;
    padding-left: 7.5px;
    padding-right: 7.5px;
    text-align: right;
  }

  .chain-balance-item-row__col-3 {
    flex-grow: 2.91;
    max-width: 29.1%;
    padding-left: 7.5px;
    padding-right: 25px;
    text-align: right;
  }
`));
