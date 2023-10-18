// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface ChainInfoItem extends InfoItemBase {
  chain: string
}

const Component: React.FC<ChainInfoItem> = (props: ChainInfoItem) => {
  const { chain, className, label, valueColorSchema = 'default' } = props;
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const chainInfo = useMemo(() => (chainInfoMap[chain]), [chain, chainInfoMap]);

  return (
    <div className={CN(className, '__row -type-chain')}>
      {
        !!label && (
          <div className={'__col __label-col'}>
            <div className={'__label'}>
              {label}
            </div>
          </div>
        )
      }
      <div className={'__col __value-col -to-right'}>
        <div className={`__chain-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <Logo
            className={'__chain-logo'}
            network={chain}
            size={24}
          />

          <div className={'__chain-name ml-xs'}>
            {chainInfo?.name}
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
