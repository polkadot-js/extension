// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext } from '@subwallet/extension-koni-ui/components';
import { store } from '@subwallet/extension-koni-ui/stores';
import { BondingParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  icon: string;
  network: NetworkJson;
}

function BondingNetworkSelection ({ className, icon, network }: Props): React.ReactElement<Props> {
  const navigate = useContext(ActionContext);

  const handleOnClick = useCallback(() => {
    store.dispatch({ type: 'bondingParams/update', payload: { selectedNetwork: network.key, selectedValidator: '' } as BondingParams });
    navigate('/account/select-bonding-validator');
  }, [navigate, network.key]);

  return (
    <div
      className={className}
      onClick={handleOnClick}
    >
      <div
        className={'network-item-row'}
      >
        <div className={'bonding-network-info'}>
          <img
            alt='logo'
            className={'network-logo'}
            src={icon}
          />

          <div className={'bonding-network-name'}>
            {network.chain}
          </div>
        </div>

        <div className={'bonding-item-toggle'} />
      </div>
    </div>
  );
}

export default React.memo(styled(BondingNetworkSelection)(({ theme }: Props) => `
  .network-item-row {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }

  .bonding-network-info {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .network-logo {
    display: block;
    min-width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #fff;
    cursor: pointer;
  }

  .bonding-item-toggle {
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(-45deg);
  }

  .bonding-network-name {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
  }
`));
