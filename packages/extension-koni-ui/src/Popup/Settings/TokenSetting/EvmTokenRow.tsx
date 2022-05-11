// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken, DeleteEvmTokenParams } from '@subwallet/extension-base/background/KoniTypes';
import Checkbox from '@subwallet/extension-koni-ui/components/Checkbox';
import Link from '@subwallet/extension-koni-ui/components/Link';
import { store } from '@subwallet/extension-koni-ui/stores';
import { TokenConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  item: CustomEvmToken;
  handleSelected: (val: DeleteEvmTokenParams) => void;
  handleUnselected: (val: DeleteEvmTokenParams) => void;
}

function EvmTokenRow ({ className, handleSelected, handleUnselected, item }: Props): React.ReactElement {
  const [isCheck, setIsChecked] = useState(false);

  const updateTokenEditParams = useCallback(() => {
    store.dispatch({ type: 'tokenConfigParams/update', payload: { data: item } as TokenConfigParams });
  }, [item]);

  const handleCheck = useCallback((checked: boolean) => {
    setIsChecked(checked);

    if (checked) {
      handleSelected({
        smartContract: item.smartContract,
        chain: item.chain,
        type: item.type
      });
    } else {
      handleUnselected({
        smartContract: item.smartContract,
        chain: item.chain,
        type: item.type
      });
    }
  }, [handleSelected, handleUnselected, item.chain, item.smartContract, item.type]);

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      className={`network-item ${className}`}
    >
      <div className='network-item__top-content'>
        <Checkbox
          checked={isCheck}
          className={'checkbox-container'}
          label={''}
          onChange={handleCheck}
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
