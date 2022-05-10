// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getLogoByNetworkKey } from '@polkadot/extension-koni-ui/util';

interface Props {
  className: string;
  networkKey: string;
  symbol: string;
}

function TokenItem ({ className = '', networkKey, symbol }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <img
        alt={networkKey}
        className='token-item-logo'
        src={getLogoByNetworkKey(networkKey)}
      />
      <div className='token-item-right-content'>
        <div className='token-item__symbol'>{symbol}</div>
        <div className='token-item__chain'>{NETWORKS[networkKey].chain}</div>
      </div>
    </div>
  );
}

export default React.memo(styled(TokenItem)(({ theme }: ThemeProps) => `
  display: flex;
  align-items: center;

  .token-item__symbol {
    font-size: 18px;
    line-height: 26px;
    color: ${theme.textColor};

  }

  .token-item__chain {
    font-size: 12px;
  }

  .token-item-logo {
    height: 30px;
    min-width: 30px;
    border-radius: 50%;
    margin-right: 6px;
    border: 2px solid transparent;
    background: ${theme.identiconBackground};
  }
`));
