// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActionContext, Button, ButtonArea, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function NetworkEdit ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/networks');
      onAction('/account/networks');
    },
    [onAction]
  );

  const _onEditNetwork = useCallback(() => {
    _goBack();
  }, [_goBack]);

  const networkInfo = {
    name: 'Moonriver',
    rpcUrl: 'http://rpc.moonriver.moonbeam.network',
    chainId: '1285',
    currencySymbol: 'MOVR',
    blockExplorerUrl: 'http://blockscout.moonriver.moonbeam.network'
  };

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Network Edit')}
      />

      <div className={className}>
        <InputWithLabel
          label={t<string>('Network name')}
          value={networkInfo.name}
        />

        <InputWithLabel
          label={t<string>('New RPC URL')}
          value={networkInfo.rpcUrl}
        />

        <InputWithLabel
          label={t<string>('Chain id')}
          value={networkInfo.chainId}
        />

        <InputWithLabel
          label={t<string>('Currency symbol')}
          value={networkInfo.currencySymbol}
        />

        <InputWithLabel
          label={t<string>('Block Explorer (Optional)')}
          value={networkInfo.blockExplorerUrl}
        />

        <ButtonArea>
          <Button
            className='network-edit-button'
            onClick={_goBack}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='network-edit-button'
            onClick={_onEditNetwork}
          >
            {t<string>('Save')}
          </Button>
        </ButtonArea>
      </div>
    </>
  );
}

export default styled(NetworkEdit)(({ theme }: Props) => `
  padding: 0 15px 15px;
  flex: 1;
  overflow-y: auto;

  .network-edit__action-area {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 7px;
  }

  .network-edit-button {
    flex: 1;
  }

  .network-edit-button:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .network-edit-button:last-child {
    margin-left: 8px;
  }


`);
