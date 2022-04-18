// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isValidProvider } from '@polkadot/extension-koni-base/utils/utils';
import { ActionContext, Button, ButtonArea, InputWithLabel } from '@polkadot/extension-koni-ui/components';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { apiMapConnect } from '@polkadot/extension-koni-ui/messaging';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function NetworkEdit ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { show } = useToast();
  const { networkEditParams: { data, mode } } = useSelector((state: RootState) => state);
  const [networkInfo, setNetworkInfo] = useState(data);
  const [_isValidProvider, _setIsvalidProvider] = useState(false);
  const [isProviderConnected, setIsProviderConnected] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/networks');
      onAction('/account/networks');
    },
    [onAction]
  );

  useEffect(() => {
    if (provider) {
      if (!isValidProvider(provider)) {
        _setIsvalidProvider(false);
      } else {
        _setIsvalidProvider(true);
        // Call backend to validate
        apiMapConnect(provider).then((resp) => {
          setIsProviderConnected(resp.success);

          if (resp.success) {
            setNetworkInfo({
              ...networkInfo,
              customProviders: provider
            });
          }
        }).catch(console.error);
      }
    }
  }, [networkInfo, networkInfo.currentProvider, provider]);

  const _onSaveNetwork = useCallback(() => {
    if (!_isValidProvider || !isProviderConnected) {
      return;
    }

    console.log(mode, networkInfo);
    // _goBack();
  }, [_isValidProvider, isProviderConnected, mode, networkInfo]);

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
        subHeaderName={t<string>('Network Edit')}
        to='/account/networks'
      />

      <div className={className}>
        <InputWithLabel
          label={t<string>('Network name')}
          onChange={onChangeChain}
          value={networkInfo.chain || ''}
        />

        <InputWithLabel
          label={t<string>('Provider URL (*)')}
          onChange={onChangeProvider}
          value={provider || ''}
        />
        {
          !_isValidProvider && provider !== null && <div className={'invalid-input'}>Provider URL requires http/https or wss prefix</div>
        }

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

        {isProviderConnected && _isValidProvider && <div className={'connect-success'}>Provider connected successfully</div>}

        {!isProviderConnected && _isValidProvider && <div>Provider cannot connect</div>}

        <ButtonArea className={'button-area'}>
          <Button
            className='network-edit-button'
            onClick={_goBack}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='network-edit-button'
            isDisabled={!isProviderConnected || !_isValidProvider}
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
