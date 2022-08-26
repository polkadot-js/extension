// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  feeString?: string;
}

const FeeValue = ({ className, feeString }: Props) => {
  if (!feeString) {
    return null;
  }

  const [value, symbol] = feeString.split(' ');
  const [prefix, postfix] = value.split('.');
  const length = parseFloat(prefix) >= 1 ? 2 : 4;

  const postfixValue = postfix.substring(0, length);

  return (
    <span className={CN(className, 'balance-val')}>
      <span className='balance-val__prefix'>{prefix}</span>

      .<span className='balance-val__postfix'>
        {postfixValue}
      </span>
      &nbsp;{symbol}
    </span>
  );
};

export default React.memo(styled(FeeValue)(({ theme }: Props) => `
  .balance-val__postfix {
    opacity: 0.6;
  }
`));
