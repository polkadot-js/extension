// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { NetworkJson } from '@polkadot/extension-base/background/KoniTypes';
import { HorizontalLabelToggle, Link } from '@polkadot/extension-koni-ui/components';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import { disableNetworkMap, enableNetworkMap } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';
import { NetworkCreateParams } from '@polkadot/extension-koni-ui/stores/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  item: NetworkJson;
}

function NetworkItem ({ className, item }: Props): React.ReactElement {
  const { show } = useToast();

  const handleShowConfirm = useCallback((resp: boolean) => {
    if (resp) {
      show(`${item.chain} has ${item.active ? 'disconnected' : 'connected'} successfully`);
    } else {
      show(`${item.chain} has failed to ${item.active ? 'disconnect' : 'connect'}`);
    }
  }, [item, show]);

  const toggleActive = useCallback((val: boolean) => {
    if (!val) {
      disableNetworkMap(item.key)
        .then((resp) => handleShowConfirm(resp))
        .catch(console.error);
    } else {
      enableNetworkMap(item.key)
        .then((resp) => handleShowConfirm(resp))
        .catch(console.error);
    }
  }, [handleShowConfirm, item.key]);

  const updateNetworkEditParams = useCallback(() => {
    store.dispatch({ type: 'networkCreateParams/update', payload: { data: item, mode: 'edit' } as NetworkCreateParams });
  }, [item]);

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      className={`network-item ${className}`}
    >
      <div className='network-item__top-content'>
        <HorizontalLabelToggle
          checkedLabel={''}
          className='info'
          toggleFunc={toggleActive}
          uncheckedLabel={''}
          value={item.active}
        />
        <Link
          className={'link-edit'}
          onClick={updateNetworkEditParams}
          to='/account/config-network'
        >
          <div className='network-item__text'>{item.chain}</div>
          <div className='network-item__toggle' />
        </Link>
      </div>
      <div className='network-item__separator' />
    </div>
  );
}

export default styled(NetworkItem)(({ theme }: Props) => `
  .link-edit {
    cursor: pointer;
    width: 100%;
  }
`);
