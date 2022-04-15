// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ActionContext, Button, ButtonArea, InputWithLabel } from '@polkadot/extension-koni-ui/components';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function NetworkEdit ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { networkEditParams: { data, mode } } = useSelector((state: RootState) => state);
  const [networkInfo, setNetworkInfo] = useState(data);
  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/networks');
      onAction('/account/networks');
    },
    [onAction]
  );

  const _onEditNetwork = useCallback(() => {
    console.log(mode, networkInfo);
    // _goBack();
  }, [mode, networkInfo]);

  const onChangeChain = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      chain: val
    });
  }, [networkInfo]);

  const onChangeProvider = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      customProviders: { custom: val }
    });
  }, [networkInfo]);

  const onChangeParaId = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      paraId: parseInt(val)
    });
  }, [networkInfo]);

  const onChangeExplorer = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      blockExplorer: val
    });
  }, [networkInfo]);

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Network Edit')}
        to='/account/networks'
      />

      <div className={className}>
        <InputWithLabel
          label={t<string>('Network name')}
          onChange={onChangeChain}
          value={networkInfo.chain}
        />

        <InputWithLabel
          label={t<string>('Provider')}
          onChange={onChangeProvider}
          value={networkInfo.providers[networkInfo.currentProvider]}
        />

        <InputWithLabel
          label={t<string>('paraId')}
          onChange={onChangeParaId}
          value={networkInfo?.paraId?.toString() || ''}
        />

        <InputWithLabel
          label={t<string>('Block Explorer (Optional)')}
          onChange={onChangeExplorer}
          value={networkInfo?.blockExplorer || ''}
        />

        <ButtonArea className={'button-area'}>
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

  .button-area {
    margin-top: 20px;
  }

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
