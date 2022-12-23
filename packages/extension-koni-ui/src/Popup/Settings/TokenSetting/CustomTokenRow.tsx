// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/extension-koni-base/services/chain-list/types';
import { _DeleteCustomTokenParams } from '@subwallet/extension-koni-base/services/chain-service/types';
import { ActionContext } from '@subwallet/extension-koni-ui/components';
import Checkbox from '@subwallet/extension-koni-ui/components/Checkbox';
import { store } from '@subwallet/extension-koni-ui/stores';
import { TokenConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  item: _ChainAsset;
  handleSelected: (val: _DeleteCustomTokenParams) => void;
  handleUnselected: (val: _DeleteCustomTokenParams) => void;
}

function CustomTokenRow ({ className, handleSelected, handleUnselected, item }: Props): React.ReactElement {
  const [isCheck, setIsChecked] = useState(false);
  const navigate = useContext(ActionContext);

  const updateTokenEditParams = useCallback(() => {
    store.dispatch({ type: 'tokenConfigParams/update', payload: { data: item } as TokenConfigParams });
    navigate('/account/token-edit');
  }, [item, navigate]);

  const handleCheck = useCallback((checked: boolean) => {
    setIsChecked(checked);

    if (checked) {
      handleSelected({
        contractAddress: item?.metadata?.contractAddress as string,
        originChain: item.originChain,
        type: item.assetType
      });
    } else {
      handleUnselected({
        contractAddress: item?.metadata?.contractAddress as string,
        originChain: item.originChain,
        type: item.assetType
      });
    }
  }, [handleSelected, handleUnselected, item.assetType, item?.metadata?.contractAddress, item.originChain]);

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      className={`network-item ${className}`}
    >
      <div className='token-item__top-content'>
        <Checkbox
          checked={isCheck}
          className={'checkbox-container'}
          label={''}
          onChange={handleCheck}
        />

        <div
          className={'link-edit'}
          onClick={updateTokenEditParams}
        >
          <div className='token-item__text'>{item.name || item.symbol}</div>
          <div className='token-item__toggle' />
        </div>
      </div>
      <div className='network-item__separator' />
    </div>
  );
}

export default styled(CustomTokenRow)(({ theme }: Props) => `
  .link-edit {
    cursor: pointer;
    width: 82%;
    padding-top: 12px;
    padding-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${theme.textColor2};
  }

  .link-edit:hover {
    color: ${theme.textColor};
  }

  .checkbox-container {
    margin-left: 24px;
    margin-right: 12px;
  }
`);
