// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import arrowCounterClockWise from '@subwallet/extension-koni-ui/assets/arrow-counter-clockwise.svg';
import { ActionContext } from '@subwallet/extension-koni-ui/components/contexts';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
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
  const networkJson = useGetNetworkJson(networkKey);
  const navigate = useContext(ActionContext);
  const { show } = useToast();
  const handleClickReload = useCallback(() => {
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

  const handleClickEdit = useCallback(() => {
    store.dispatch({ type: 'networkConfigParams/update', payload: { data: networkJson, mode: 'edit' } as NetworkConfigParams });
    navigate('/account/config-network');
  }, [navigate, networkJson]);

  return (
    <div className={className}>
      <div className={'network-action-container'}>
        <img
          alt='reload'
          className={'reload-network-btn'}
          onClick={handleClickReload}
          src={arrowCounterClockWise}
        />

        <FontAwesomeIcon
          className='network-edit-icon'
          // @ts-ignore
          icon={faPen}
          onClick={handleClickEdit}
        />
      </div>
    </div>
  );
}

export default React.memo(styled(NetworkTools)(({ theme }: Props) => `
  .reload-network-btn {
    cursor: pointer;
  }

  .network-edit-icon {
    color: ${theme.primaryColor};
    cursor: pointer;
  }

  .network-action-container {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`));
