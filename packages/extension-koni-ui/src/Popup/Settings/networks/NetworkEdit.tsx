// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { NetworkJson } from '@polkadot/extension-base/background/KoniTypes';
import { isValidProvider } from '@polkadot/extension-koni-base/utils/utils';
import { ActionContext, Button, ButtonArea, InputWithLabel } from '@polkadot/extension-koni-ui/components';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { apiMapConnect, upsertNetworkMap } from '@polkadot/extension-koni-ui/messaging';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function getCurrentEndpoint (data: NetworkJson) {
  if (data.currentProvider === 'custom') {
    return data?.customProviders?.custom as string;
  } else {
    return data.providers[data.currentProvider];
  }
}

function NetworkEdit ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { show } = useToast();
  const { networkEditParams: { data, mode } } = useSelector((state: RootState) => state);
  const [networkInfo, setNetworkInfo] = useState(data);
  const [_isValidProvider, _setIsvalidProvider] = useState(false);
  const [isProviderConnected, setIsProviderConnected] = useState(false);
  const [provider, setProvider] = useState<string | null>(mode === 'edit' ? getCurrentEndpoint(data) : null);
  const [loading, setLoading] = useState(false);
  const [needCheckConnection, setNeedCheckConnection] = useState(mode === 'create');

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/networks');
      onAction('/account/networks');
    },
    [onAction]
  );

  useEffect(() => { // check provider
    if (provider) {
      if (!isValidProvider(provider)) {
        _setIsvalidProvider(false);
      } else {
        _setIsvalidProvider(true);
        setNeedCheckConnection(true);
      }
    }
  }, [provider]);

  useEffect(() => {
    if (provider && _isValidProvider && needCheckConnection) {
      setLoading(true);
      // Call backend to validate
      apiMapConnect(provider).then((resp) => {
        setLoading(false);
        setIsProviderConnected(resp.success);

        if (resp.success) {
          setNetworkInfo({
            ...networkInfo,
            key: resp.key,
            active: true,
            customProviders: { custom: provider },
            currentProvider: 'custom',
            groups: resp.networkGroup,
            currentProviderMode: provider.startsWith('http') ? 'http' : 'ws',
            genesisHash: resp.genesisHash,
            ss58Format: parseInt(resp.ss58Prefix),
            chain: resp.chain
          });
        }
      }).catch(console.error);
    }
  }, [_isValidProvider, needCheckConnection, networkInfo, provider]);

  const _onSaveNetwork = useCallback(() => {
    if (!_isValidProvider || !isProviderConnected) {
      return;
    }

    // upsertNetworkMap(networkInfo).then((resp) => {
    //   if (resp.errors.length <= 0) {
    //     show('Successfully added a new network');
    //     window.localStorage.setItem('popupNavigation', '/');
    //     onAction('/');
    //   } else {
    //     show(`New network has conflicts with ${resp.conflictNetwork} network`);
    //   }
    // }).catch(console.error);

    console.log(mode, networkInfo);
  }, [_isValidProvider, isProviderConnected, mode, networkInfo, onAction, show]);

  const onChangeChain = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      chain: val
    });
  }, [networkInfo]);

  const onChangeProvider = useCallback((val: string) => {
    setProvider(val);
  }, []);

  const onChangeParaId = useCallback((val: string) => {
    if (val === '') {
      setNetworkInfo({
        ...networkInfo,
        paraId: undefined
      });

      return;
    }

    const paraId = parseInt(val);

    if (isNaN(paraId)) {
      show('ParaId can only be number');
    } else {
      setNetworkInfo({
        ...networkInfo,
        paraId
      });
    }
  }, [networkInfo, show]);

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
        subHeaderName={mode === 'edit' ? t<string>('Network Edit') : t<string>('Add new network')}
        to='/account/networks'
      />

      <div className={className}>
        <InputWithLabel
          label={t<string>('Provider URL (*)')}
          onChange={onChangeProvider}
          value={provider || ''}
        />
        {
          !_isValidProvider && provider !== null && <div className={'invalid-input'}>Provider URL requires http/https or wss prefix</div>
        }

        <InputWithLabel
          label={t<string>('Network name (*)')}
          onChange={onChangeChain}
          value={networkInfo.chain || ''}
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

        {isProviderConnected && _isValidProvider && !loading && <div className={'connect-success'}>Provider connected successfully</div>}

        {!isProviderConnected && _isValidProvider && !loading && <div className={'connect-fail'}>Provider cannot connect</div>}

        {loading && <div className={'connect-info'}>Connecting to the provider...</div>}

        <ButtonArea className={'button-area'}>
          <Button
            className='network-edit-button'
            onClick={_goBack}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='network-edit-button'
            isDisabled={!isProviderConnected || !_isValidProvider || networkInfo.chain === ''}
            onClick={_onSaveNetwork}
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

  .connect-info {
    margin-top: 10px;
    font-size: 14px;
  }

  .connect-success {
    margin-top: 10px;
    font-size: 14px;
    color: green;
  }

  .connect-fail {
    margin-top: 10px;
    font-size: 14px;
    color: red;
  }

  .invalid-input {
    color: red;
    font-size: 12px;
  }

  .button-area {
    margin-top: 10px;
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
