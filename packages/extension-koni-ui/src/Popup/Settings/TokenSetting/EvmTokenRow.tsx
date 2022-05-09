// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { CustomEvmToken } from '@polkadot/extension-base/background/KoniTypes';
import Checkbox from '@polkadot/extension-koni-ui/components/Checkbox';
import Link from '@polkadot/extension-koni-ui/components/Link';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import { store } from '@polkadot/extension-koni-ui/stores';
import { TokenConfigParams } from '@polkadot/extension-koni-ui/stores/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  item: CustomEvmToken;
}

function EvmTokenRow ({ className, item }: Props): React.ReactElement {
  const { show } = useToast();

  const updateTokenEditParams = useCallback(() => {
    store.dispatch({ type: 'tokenConfigParams/update', payload: { data: item } as TokenConfigParams });
  }, [item]);

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      className={`network-item ${className}`}
    >
      <div className='network-item__top-content'>
        <Checkbox
          checked={false}
          className={'checkbox-container'}
          label={''}
        />
        <Link
          className={'link-edit'}
          onClick={updateTokenEditParams}
          to='/account/evm-token-edit'
        >
          <div className='network-item__text'>{item.name || item.symbol}</div>
          <div className='network-item__toggle' />
        </Link>
      </div>
      <div className='network-item__separator' />
    </div>
  );
}

export default styled(EvmTokenRow)(({ theme }: Props) => `
  .link-edit {
    cursor: pointer;
    width: 100%;
  }

  .checkbox-container {
    margin-left: 24px;
    margin-right: 12px;
  }
`);
