// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface ChainInfoItem extends InfoItemBase {
  chain: string,
  chainName: string,
}

const Component: React.FC<ChainInfoItem> = (props: ChainInfoItem) => {
  const { chain, chainName, className, label, valueColorSchema = 'default' } = props;

  return (
    <div className={CN(className, '__row -type-chain')}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__chain-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <Logo
            className={'__chain-logo'}
            network={chain}
            size={24}
          />

          <div className={'__chain-name ml-xs'}>
            {chainName}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChainItem = styled(Component)<ChainInfoItem>(({ theme: { token } }: ChainInfoItem) => {
  return {};
});

export default ChainItem;
