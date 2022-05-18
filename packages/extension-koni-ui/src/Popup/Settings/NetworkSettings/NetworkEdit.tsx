// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NETWORK_ERROR, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { isUrl, isValidProvider } from '@subwallet/extension-koni-base/utils/utils';
import { ActionContext, Button, ButtonArea, Dropdown, HorizontalLabelToggle, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { upsertNetworkMap, validateNetwork } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function getCurrentEndpoint (data: NetworkJson) {
  if (!data) {
    return null;
  }

  if (data.currentProvider === 'custom') {
    return data?.customProviders?.custom as string;
  } else {
    return data.providers[data.currentProvider];
  }
}

function getAllProviders (data: NetworkJson) {
  const allProviders: Record<string, string>[] = [];

  for (const [key, provider] of Object.entries(data.providers)) {
    allProviders.push({
      text: provider,
      value: key
    });
  }

  if (data.customProviders) {
    for (const [key, provider] of Object.entries(data.customProviders)) {
      allProviders.push({
        text: provider,
        value: key
      });
    }
  }

  return allProviders;
}

function getAllProviderKeys (data: NetworkJson) {
  const allProviderKeys: string[] = [];

  for (const key of Object.keys(data.providers)) {
    allProviderKeys.push(key);
  }

  if (data.customProviders) {
    for (const key of Object.keys(data.customProviders)) {
      allProviderKeys.push(key);
    }
  }

  return allProviderKeys;
}

function NetworkEdit ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { show } = useToast();
  const { networkConfigParams: { data, mode } } = useSelector((state: RootState) => state);
  const [networkInfo, setNetworkInfo] = useState(data);
  const [_isValidProvider, _setIsvalidProvider] = useState(false);
  const [isProviderConnected, setIsProviderConnected] = useState(false);
  const [provider, setProvider] = useState<string | null>(getCurrentEndpoint(data) || null);
  const [loading, setLoading] = useState(false);
  const [needValidate, setNeedValidate] = useState(false);
  const isCurrentEndpoint = provider === getCurrentEndpoint(data);
  const [validateError, setValidateError] = useState<NETWORK_ERROR>(NETWORK_ERROR.NONE);
  const [isEthereum, setIsEthereum] = useState(data.isEthereum || false);
  const [showMore, setShowMore] = useState(false);
  const [isValidBlockExplorer, setIsValidBlockExplorer] = useState(true);
  const [isValidCrowdloanUrl, setIsValidCrowdloanUrl] = useState(true);
  const [isValidChain, setIsValidChain] = useState(true);
  const [isProviderPredefined, setIsProviderPredefined] = useState(true);

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/networks');
      onAction('/account/networks');
    },
    [onAction]
  );

  useEffect(() => {
    if (mode === 'init') {
      _goBack();
    }
  }, [_goBack, mode, networkInfo.currentProvider]);

  const getValidateErrorMessage = useCallback((input?: string) => {
    if (validateError === NETWORK_ERROR.EXISTED_NETWORK || input === NETWORK_ERROR.EXISTED_NETWORK) {
      return 'This network has already been added';
    } else if (validateError === NETWORK_ERROR.EXISTED_PROVIDER || input === NETWORK_ERROR.EXISTED_PROVIDER) {
      return 'This provider has existed';
    } else if (validateError === NETWORK_ERROR.PROVIDER_NOT_SAME_NETWORK || input === NETWORK_ERROR.PROVIDER_NOT_SAME_NETWORK) {
      return 'This provider is not the same network';
    } else {
      return 'Unable to connect to the provider';
    }
  }, [validateError]);

  useEffect(() => { // check provider for network creation
    if (provider) {
      if (!isValidProvider(provider)) {
        show('Provider URL requires http/https or wss prefix');
        _setIsvalidProvider(false);
      } else {
        _setIsvalidProvider(true);

        if (needValidate && !isCurrentEndpoint) {
          setLoading(true);

          validateNetwork(provider, isEthereum).then((resp) => {
            if (resp.error) {
              setValidateError(resp.error);
            }

            setNeedValidate(false);
            setLoading(false);
            setIsProviderConnected(resp.success);

            if (resp.success) {
              if (isEthereum) {
                setNetworkInfo({
                  ...networkInfo,
                  key: resp.key,
                  active: true,
                  customProviders: { custom: provider },
                  currentProvider: 'custom',
                  groups: resp.networkGroup,
                  currentProviderMode: provider.startsWith('http') ? 'http' : 'ws',
                  genesisHash: resp.genesisHash,
                  ss58Format: -1,
                  chain: resp.chain,
                  isEthereum,
                  ethChainId: resp.ethChainId,
                  nativeToken: resp.nativeToken,
                  decimals: resp.decimal
                });
              } else {
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
                  chain: resp.chain,
                  nativeToken: resp.nativeToken,
                  decimals: resp.decimal
                });
              }
            }
          }).catch(console.error);
        }
      }
    }
  }, [data, isCurrentEndpoint, isEthereum, needValidate, networkInfo, provider, show]);

  useEffect(() => {
    setNeedValidate(true);
  }, [isEthereum]);

  const handleCreateProvider = useCallback(async (newProvider: string) => { // handle add provider for network edit
    if (!isValidProvider(newProvider)) {
      show('Provider URL requires http/https or wss prefix');

      return '';
    }

    setLoading(true);
    const resp = await validateNetwork(newProvider, isEthereum, networkInfo);

    if (resp.error) {
      show(getValidateErrorMessage(resp.error));

      return '';
    }

    setLoading(false);
    setIsProviderConnected(resp.success);

    if (resp.success) {
      show('Successfully added a new custom provider');

      if (networkInfo.customProviders) {
        const providerLength = Object.values(networkInfo.customProviders).length;

        const newCustomProvider = { [`custom_${providerLength}`]: newProvider };

        setNetworkInfo({
          ...networkInfo,
          currentProvider: `custom_${providerLength}`,
          customProviders: {
            ...networkInfo.customProviders,
            ...newCustomProvider
          }
        });

        return `custom_${providerLength}`;
      } else {
        setNetworkInfo({
          ...networkInfo,
          currentProvider: 'custom',
          customProviders: { custom: newProvider }
        });

        return 'custom';
      }
    }

    return '';
  }, [getValidateErrorMessage, isEthereum, networkInfo, show]);

  const onSelectProvider = useCallback((val: any) => {
    const providerKey = val as string;

    if (getAllProviderKeys(networkInfo).includes(providerKey)) {
      setNeedValidate(false);
      setIsProviderPredefined(true);
      setNetworkInfo({
        ...networkInfo,
        currentProvider: providerKey
      });
    }
  }, [networkInfo]);

  const toggleEthereum = useCallback((val: boolean) => {
    setIsEthereum(val);
  }, []);

  const toggleShowMore = useCallback((val: boolean) => {
    setShowMore(val);
  }, []);

  const _onSaveNetwork = useCallback(() => {
    if ((!_isValidProvider || !isProviderConnected) && !isCurrentEndpoint) {
      return;
    }

    upsertNetworkMap(networkInfo).then((resp) => {
      if (resp) {
        show('Your changes are saved successfully');
        window.localStorage.setItem('popupNavigation', '/');
        _goBack();
      } else {
        show('Error trying to configure network');
      }
    }).catch(console.error);
  }, [_goBack, _isValidProvider, isCurrentEndpoint, isProviderConnected, networkInfo, show]);

  const onChangeChain = useCallback((val: string) => {
    if (val.split(' ').join('') === '') {
      setIsValidChain(false);
    } else {
      setIsValidChain(true);
    }

    setNetworkInfo({
      ...networkInfo,
      chain: val
    });
  }, [networkInfo]);

  const onChangeProvider = useCallback((val: string) => {
    setProvider(val);
    setNeedValidate(true);
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

  const onChangeEthChainId = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      ethChainId: parseInt(val)
    });
  }, [networkInfo]);

  const onChangeCoingeckoKey = useCallback((val: string) => {
    setNetworkInfo({
      ...networkInfo,
      coinGeckoKey: val
    });
  }, [networkInfo]);

  const onChangeCrowdloanUrl = useCallback((val: string) => {
    if (!isUrl(val) && val !== '') {
      show('Crowdloan URL must be an URL');
      setIsValidCrowdloanUrl(false);
    } else {
      setIsValidCrowdloanUrl(true);
    }

    setNetworkInfo({
      ...networkInfo,
      crowdloanUrl: val
    });
  }, [networkInfo, show]);

  const onChangeExplorer = useCallback((val: string) => {
    if (!isUrl(val) && val !== '') {
      setIsValidBlockExplorer(false);
      show('Block explorer must be an URL');
    } else {
      setIsValidBlockExplorer(true);
    }

    setNetworkInfo({
      ...networkInfo,
      blockExplorer: val
    });
  }, [networkInfo, show]);

  const isDisableSave = useCallback((): boolean => {
    if (mode === 'create') {
      return !isValidChain || needValidate || !isProviderConnected || !_isValidProvider || !isValidBlockExplorer || !isValidCrowdloanUrl || !networkInfo.chain || networkInfo.chain === '';
    } else {
      return !_isValidProvider || !isValidChain || needValidate || (!isProviderPredefined && !isProviderConnected) || !isValidBlockExplorer || !isValidCrowdloanUrl || !networkInfo.chain || networkInfo.chain === '';
    }
  }, [_isValidProvider, isProviderConnected, isProviderPredefined, isValidBlockExplorer, isValidChain, isValidCrowdloanUrl, mode, needValidate, networkInfo.chain]);

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Configure network')}
        to='/account/networks'
      />

      <div className={className}>
        {
          mode === 'create' &&
            <InputWithLabel
              label={t<string>('Provider URL (*)')}
              onChange={onChangeProvider}
              value={provider || ''}
            />
        }

        {
          mode === 'edit' &&
          <div style={{ marginTop: '12px' }}>
            <Dropdown
              allowAdd={true}
              handleCreate={handleCreateProvider}
              label={'Provider URL (*)'}
              onChange={onSelectProvider}
              options={getAllProviders(networkInfo)}
              value={networkInfo.currentProvider}
            />
          </div>
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

        {
          mode === 'create' &&
          <div className={'toggle-container'}>
            <div>EVM chain</div>
            <HorizontalLabelToggle
              checkedLabel={''}
              className='info'
              toggleFunc={toggleEthereum}
              uncheckedLabel={''}
              value={isEthereum}
            />
          </div>
        }

        {
          isEthereum &&
          <InputWithLabel
            disabled
            label={t<string>('Ethereum Chain ID')}
            onChange={onChangeEthChainId}
            value={networkInfo?.ethChainId?.toString() || ''}
          />
        }

        <div className={'option-toggle-container'}>
          <div>More options</div>
          <HorizontalLabelToggle
            checkedLabel={''}
            className='info'
            toggleFunc={toggleShowMore}
            uncheckedLabel={''}
            value={showMore}
          />
        </div>

        {
          showMore &&
          <div>
            <InputWithLabel
              label={t<string>('Block Explorer (Optional)')}
              onChange={onChangeExplorer}
              value={networkInfo?.blockExplorer || ''}
            />

            <InputWithLabel
              label={t<string>('Crowdloan Url (Optional)')}
              onChange={onChangeCrowdloanUrl}
              value={networkInfo?.crowdloanUrl || ''}
            />

            <InputWithLabel
              label={t<string>('Coingecko key (Optional)')}
              onChange={onChangeCoingeckoKey}
              value={networkInfo?.coinGeckoKey || ''}
            />
          </div>
        }
        {!isCurrentEndpoint && isProviderConnected && _isValidProvider && !loading && <div className={'connect-success'}>Provider connected successfully</div>}

        {!isCurrentEndpoint && !isProviderConnected && _isValidProvider && !loading && <div className={'connect-fail'}>{getValidateErrorMessage()}</div>}

        {!isCurrentEndpoint && loading && <div className={'connect-info'}>Connecting to the provider...</div>}

        <ButtonArea className={'button-area'}>
          <Button
            className='network-edit-button'
            onClick={_goBack}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='network-edit-button'
            isDisabled={isDisableSave()}
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

  .option-toggle-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .toggle-container {
    display: flex;
    margin-top: 12px;
  }

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
