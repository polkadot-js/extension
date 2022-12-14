// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import arrowCounterClockWise from '@subwallet/extension-koni-ui/assets/arrow-counter-clockwise.svg';
import { IconMaps } from '@subwallet/extension-koni-ui/assets/icon';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { ActionContext } from '@subwallet/extension-koni-ui/contexts';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import { recoverDotSamaApi } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  networkKey: string;
}

function NetworkTools ({ className, networkKey }: Props): React.ReactElement<Props> {
  const chainInfo = useFetchChainInfo(networkKey);
  const navigate = useContext(ActionContext);
  const { show } = useToast();
  const handleClickReload = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    recoverDotSamaApi(networkKey)
      .then((result) => {
        if (result) {
          show('Connection has been recovered');
        } else {
          show('Cannot establish connection to this network');
        }
      })
      .catch(console.error);
  }, [networkKey, show]);

  const handleClickEdit = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    store.dispatch({ type: 'networkConfigParams/update', payload: { data: chainInfo, mode: 'edit' } as NetworkConfigParams });
    navigate('/account/config-network');
  }, [navigate, chainInfo]);

  return (
    <div className={className}>
      <div className={'network-action-container'}>
        <img
          alt='reload-network'
          className={'reload-network-btn'}
          data-for={`reload-network-${networkKey}`}
          data-tip={true}
          onClick={handleClickReload}
          src={arrowCounterClockWise}
        />
        <Tooltip
          offset={{ top: 4 }}
          text={'Reload network'}
          trigger={`reload-network-${networkKey}`}
        />
        <div
          className={'network-edit-icon'}
          data-for={`edit-network-${networkKey}`}
          data-tip={true}
          onClick={handleClickEdit}
        >
          {IconMaps.pencil}
        </div>
        <Tooltip
          offset={{ top: 4 }}
          text={'Configure network'}
          trigger={`edit-network-${networkKey}`}
        />
      </div>
    </div>
  );
}

export default React.memo(styled(NetworkTools)(() => `
  .reload-network-btn {
    cursor: pointer;
  }

  .network-edit-icon {
    cursor: pointer;
    color: '#7B8098'
  }

  svg {
    display: block;
  }

  .network-action-container {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`));
