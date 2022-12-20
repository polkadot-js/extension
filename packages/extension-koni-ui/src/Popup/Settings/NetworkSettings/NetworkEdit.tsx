// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainEditInfo, ChainEditStandard, ChainSpecInfo, NETWORK_ERROR } from '@subwallet/extension-base/background/KoniTypes';
import { CUSTOM_NETWORK_PREFIX } from '@subwallet/extension-koni-base/services/chain-service/types';
import { _isCustomNetwork } from '@subwallet/extension-koni-base/services/chain-service/utils';
import { isUrl, isValidProvider as _isValidProvider } from '@subwallet/extension-koni-base/utils';
import { ActionContext, Button, ButtonArea, Dropdown, HorizontalLabelToggle, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetChainInfoForConfig from '@subwallet/extension-koni-ui/hooks/screen/setting/useGetChainInfoForConfig';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation, validateNetwork } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function getAllProviders (data: Record<string, string>) {
  const allProviders: Record<string, string>[] = [];

  for (const [key, provider] of Object.entries(data)) {
    allProviders.push({
      text: provider,
      value: key
    });
  }

  return allProviders;
}

enum ChainEditActionType {
  UPDATE_NAME = 'UPDATE_NAME',
  UPDATE_CURRENT_PROVIDER = 'UPDATE_CURRENT_PROVIDER',
  UPDATE_BLOCK_EXPLORER = 'UPDATE_BLOCK_EXPLORER',
  UPDATE_CROWDLOAN_URL = 'UPDATE_CROWDLOAN_URL',
  UPDATE_PRICE_ID = 'UPDATE_PRICE_ID',
  UPDATE_NEW_PROVIDER = 'UPDATE_NEW_PROVIDER',
  UPDATE_SYMBOL = 'UPDATE_SYMBOL'
}

interface ChainEditAction {
  type: ChainEditActionType,
  payload: Record<string, any> | string
}

const initChainEditInfo: ChainEditInfo = {
  chainType: ChainEditStandard.UNKNOWN,
  currentProvider: '',
  name: '',
  providers: {},
  slug: '',
  symbol: ''
};

function chainEditInfoReducer (state: ChainEditInfo, action: ChainEditAction) {
  switch (action.type) {
    case ChainEditActionType.UPDATE_NAME:
      return {
        ...state,
        name: action.payload as string
      };
    case ChainEditActionType.UPDATE_PRICE_ID:
      return {
        ...state,
        priceId: action.payload as string
      };
    case ChainEditActionType.UPDATE_CROWDLOAN_URL:
      return {
        ...state,
        crowdloanUrl: action.payload as string
      };
    case ChainEditActionType.UPDATE_BLOCK_EXPLORER:
      return {
        ...state,
        blockExplorer: action.payload as string
      };
    case ChainEditActionType.UPDATE_CURRENT_PROVIDER:
      return {
        ...state,
        currentProvider: action.payload as string
      };

    case ChainEditActionType.UPDATE_NEW_PROVIDER: {
      const { newProvider, newProviderKey } = action.payload as Record<string, string>;

      return {
        ...state,
        providers: {
          ...state.providers,
          [newProviderKey]: newProvider
        },
        currentProvider: newProviderKey
      };
    }

    case ChainEditActionType.UPDATE_SYMBOL:
      return {
        ...state,
        symbol: action.payload as string
      };

    default:
      throw new Error();
  }
}

interface ValidationState {
  validationError: NETWORK_ERROR,
  isValidCrowdloanUrl: boolean,
  isValidName: boolean,
  isValidSymbol: boolean,
  isValidBlockExplorer: boolean,
  needValidating: boolean,
  loading: boolean,

  // handle provider selection
  isCurrentEndpoint: boolean,
  isProviderPredefined: boolean,

  // handle provider creation
  isNewProviderValid: boolean,
  isProviderConnected: boolean,
  isNewProvider: boolean
}

const initValidationState: ValidationState = {
  validationError: NETWORK_ERROR.NONE,
  isValidBlockExplorer: true,
  isValidName: true,
  isValidCrowdloanUrl: true,
  needValidating: false,
  loading: false,
  isNewProviderValid: false,
  isProviderConnected: false,
  isCurrentEndpoint: false,
  isProviderPredefined: true,
  isNewProvider: false,
  isValidSymbol: false
};

enum ValidationStateActionType {
  UPDATE_VALIDATION_ERROR = 'UPDATE_VALIDATION_ERROR',
  UPDATE_CROWDLOAN_URL_VALIDATION = 'UPDATE_CROWDLOAN_URL_VALIDATION',
  UPDATE_NAME_VALIDATION = 'UPDATE_NAME_VALIDATION',
  UPDATE_BLOCK_EXPLORER_VALIDATION = 'UPDATE_BLOCK_EXPLORER_VALIDATION',
  UPDATE_NEED_VALIDATING = 'UPDATE_NEED_VALIDATING',
  UPDATE_LOADING = 'UPDATE_LOADING',
  UPDATE_PROVIDER_VALIDATION = 'UPDATE_PROVIDER_VALIDATION',
  UPDATE_PROVIDER_CONNECTED = 'UPDATE_PROVIDER_CONNECTED',
  UPDATE_PROVIDER_SELECTION = 'UPDATE_PROVIDER_SELECTION',
  UPDATE_VALIDATION_PASSED = 'UPDATE_VALIDATION_PASSED',
  UPDATE_NEW_PROVIDER = 'UPDATE_NEW_PROVIDER',
  UPDATE_SYMBOL_VALIDATION = 'UPDATE_SYMBOL_VALIDATION'
}

interface ValidationStateAction {
  type: ValidationStateActionType,
  payload: NETWORK_ERROR | boolean | Record<string, any>
}

function validationStateReducer (state: ValidationState, action: ValidationStateAction) {
  switch (action.type) {
    case ValidationStateActionType.UPDATE_VALIDATION_ERROR:
      return {
        ...state,
        validationError: action.payload as NETWORK_ERROR
      };

    case ValidationStateActionType.UPDATE_PROVIDER_SELECTION: {
      const { isCurrentEndpoint, isProviderPredefined, needValidating } = action.payload as Record<string, boolean>;

      return {
        ...state,
        isProviderPredefined,
        needValidating,
        isCurrentEndpoint
      };
    }

    case ValidationStateActionType.UPDATE_BLOCK_EXPLORER_VALIDATION:
      return {
        ...state,
        isValidBlockExplorer: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_CROWDLOAN_URL_VALIDATION:
      return {
        ...state,
        isValidCrowdloanUrl: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_LOADING:
      return {
        ...state,
        loading: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_PROVIDER_CONNECTED:
      return {
        ...state,
        isProviderConnected: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_PROVIDER_VALIDATION:
      return {
        ...state,
        isNewProviderValid: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_VALIDATION_PASSED: {
      const { isProviderConnected, needValidating } = action.payload as Record<string, boolean>;

      return {
        ...state,
        needValidating,
        isProviderConnected
      };
    }

    case ValidationStateActionType.UPDATE_NEW_PROVIDER: {
      const { isCurrentEndpoint, isProviderConnected } = action.payload as Record<string, boolean>;

      return {
        ...state,
        isProviderConnected,
        isCurrentEndpoint
      };
    }

    case ValidationStateActionType.UPDATE_NAME_VALIDATION:
      return {
        ...state,
        isValidName: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_SYMBOL_VALIDATION:
      return {
        ...state,
        isValidSymbol: action.payload as boolean
      };

    case ValidationStateActionType.UPDATE_NEED_VALIDATING:
      return {
        ...state,
        needValidating: action.payload as boolean
      };

    default:
      throw new Error();
  }
}

enum ChainSpecActionType {
  UPDATE_SPEC = 'UPDATE_SPEC'
}

interface ChainSpecAction {
  type: ChainSpecActionType,
  payload: Record<string, any>
}

const initChainSpec: ChainSpecInfo = {
  decimals: -1,
  existentialDeposit: '',
  genesisHash: '',
  paraId: null,
  addressPrefix: -1,

  evmChainId: null
};

function chainSpecReducer (state: ChainSpecInfo, action: ChainSpecAction) {
  switch (action.type) {
    case ChainSpecActionType.UPDATE_SPEC:
      return {
        ...state,
        ...action.payload
      };
    default:
      throw new Error();
  }
}

function NetworkEdit ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { show } = useToast();
  const [showMore, setShowMore] = useState(false);
  const { editInfo, mode, requestId, spec } = useGetChainInfoForConfig();

  const [chainEditInfo, dispatchChainEditInfo] = useReducer(chainEditInfoReducer, editInfo || initChainEditInfo);
  const [validationState, dispatchValidationState] = useReducer(validationStateReducer, { ...initValidationState, isValidSymbol: editInfo.symbol !== '' });
  const [chainSpec, dispatchChainSpec] = useReducer(chainSpecReducer, spec || initChainSpec);

  const [provider, setProvider] = useState<string | null>(null);

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(() => {
    if (requestId) {
      completeConfirmation('addNetworkRequest', { id: requestId, isApproved: true }).catch(console.error);
    }

    window.localStorage.setItem('popupNavigation', '/account/networks');
    onAction('/account/networks');
  }, [onAction, requestId]);

  useEffect(() => {
    if (mode === 'init') {
      _goBack();
    }
  }, [_goBack, mode]);

  const getValidateErrorMessage = useCallback((input?: string) => {
    if (validationState.validationError === NETWORK_ERROR.EXISTED_NETWORK || input === NETWORK_ERROR.EXISTED_NETWORK) {
      return 'This network has already been added';
    } else if (validationState.validationError === NETWORK_ERROR.EXISTED_PROVIDER || input === NETWORK_ERROR.EXISTED_PROVIDER) {
      return 'This provider has existed';
    } else if (validationState.validationError === NETWORK_ERROR.PROVIDER_NOT_SAME_NETWORK || input === NETWORK_ERROR.PROVIDER_NOT_SAME_NETWORK) {
      return 'This provider is not the same network';
    } else {
      return 'Unable to connect to the provider';
    }
  }, [validationState.validationError]);

  useEffect(() => {
    if (mode === 'create') {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_NEED_VALIDATING, payload: true });
    }
  }, [mode]);

  const toggleShowMore = useCallback((val: boolean) => {
    setShowMore(val);
  }, []);

  useEffect(() => { // check provider for network creation
    if (provider) {
      if (!_isValidProvider(provider)) {
        show('Provider URL requires http/https or wss prefix');

        dispatchValidationState({ type: ValidationStateActionType.UPDATE_PROVIDER_VALIDATION, payload: false });
      } else {
        dispatchValidationState({ type: ValidationStateActionType.UPDATE_PROVIDER_VALIDATION, payload: true });

        if (validationState.needValidating && !validationState.isCurrentEndpoint) {
          dispatchValidationState({ type: ValidationStateActionType.UPDATE_LOADING, payload: true });

          validateNetwork(provider, chainEditInfo.slug).then((resp) => {
            dispatchValidationState({ type: ValidationStateActionType.UPDATE_LOADING, payload: false });

            console.log('resp', resp);

            if (resp.error) {
              dispatchValidationState({ type: ValidationStateActionType.UPDATE_VALIDATION_ERROR, payload: resp.error });
            }

            dispatchValidationState({
              type: ValidationStateActionType.UPDATE_VALIDATION_PASSED,
              payload: {
                needValidating: false,
                isProviderConnected: resp.success
              }
            });

            if (resp.success) {
              console.log('validate provider ok', resp);
              // if (isEthereum) {
              //   setNetworkInfo({
              //     ...networkInfo
              //     // key: resp.key,
              //     // active: true,
              //     // customProviders: { custom: provider },
              //     // currentProvider: 'custom',
              //     // groups: resp.networkGroup,
              //     // currentProviderMode: provider.startsWith('http') ? 'http' : 'ws',
              //     // genesisHash: resp.genesisHash,
              //     // ss58Format: -1,
              //     // chain: resp.chain,
              //     // isEthereum,
              //     // evmChainId: resp.evmChainId,
              //     // nativeToken: resp.nativeToken,
              //     // decimals: resp.decimal
              //   });
              // } else {
              //   setNetworkInfo({
              //     ...networkInfo
              //     // key: resp.key,
              //     // active: true,
              //     // customProviders: { custom: provider },
              //     // currentProvider: 'custom',
              //     // groups: resp.networkGroup,
              //     // currentProviderMode: provider.startsWith('http') ? 'http' : 'ws',
              //     // genesisHash: resp.genesisHash,
              //     // ss58Format: parseInt(resp.ss58Prefix),
              //     // chain: resp.chain,
              //     // nativeToken: resp.nativeToken,
              //     // decimals: resp.decimal
              //   });
              // }
            }
          }).catch(console.error);
        }
      }
    }
  }, [chainEditInfo.slug, provider, show, validationState.isCurrentEndpoint, validationState.needValidating]);

  // const _onSaveNetwork = useCallback(() => {
  //   if ((!_isValidProvider || !isProviderConnected) && !isCurrentEndpoint) {
  //     return;
  //   }
  //
  //   upsertNetworkMap(networkInfo).then((resp) => {
  //     if (resp) {
  //       if (networkInfo.requestId) {
  //         completeConfirmation('addNetworkRequest', { id: networkInfo.requestId, isApproved: true }).catch(console.error);
  //       }
  //
  //       show('Your changes are saved successfully');
  //       window.localStorage.setItem('popupNavigation', '/');
  //       _goBack();
  //     } else {
  //       show('Error trying to configure network');
  //     }
  //   }).catch(console.error);
  // }, [_goBack, _isValidProvider, isCurrentEndpoint, isProviderConnected, networkInfo, show]);

  const onChangeProvider = useCallback((value: string) => {
    setProvider(value);
    dispatchValidationState({ type: ValidationStateActionType.UPDATE_NEED_VALIDATING, payload: true });
  }, []);

  const onChangeChainName = useCallback((value: string) => {
    if (value.split(' ').join('') === '') {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_NAME_VALIDATION, payload: false });
    } else {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_NAME_VALIDATION, payload: true });
    }

    dispatchChainEditInfo({ type: ChainEditActionType.UPDATE_NAME, payload: value });
  }, []);

  const onChangeChainSymbol = useCallback((value: string) => {
    if (value.split(' ').join('') === '' || value.length > 5) {
      if (value.length > 5) {
        show(t<string>('Symbol cannot exceed 5 characters'));
      } else {
        show(t<string>('Symbol cannot be empty'));
      }

      dispatchValidationState({ type: ValidationStateActionType.UPDATE_SYMBOL_VALIDATION, payload: false });
    } else {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_SYMBOL_VALIDATION, payload: true });
    }

    dispatchChainEditInfo({ type: ChainEditActionType.UPDATE_SYMBOL, payload: value });
  }, [show, t]);

  const onChangeExplorer = useCallback((value: string) => {
    if (!isUrl(value) && value !== '') {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_BLOCK_EXPLORER_VALIDATION, payload: false });
      show('Block explorer must be an URL');
    } else {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_BLOCK_EXPLORER_VALIDATION, payload: true });
    }

    dispatchChainEditInfo({ type: ChainEditActionType.UPDATE_BLOCK_EXPLORER, payload: value });
  }, [show]);

  const onChangeCrowdloanUrl = useCallback((value: string) => {
    if (!isUrl(value) && value !== '') {
      show('Crowdloan URL must be an URL');
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_CROWDLOAN_URL_VALIDATION, payload: false });
    } else {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_CROWDLOAN_URL_VALIDATION, payload: true });
    }

    dispatchChainEditInfo({ type: ChainEditActionType.UPDATE_CROWDLOAN_URL, payload: value });
  }, [show]);

  const onChangePriceId = useCallback((value: string) => {
    dispatchChainEditInfo({ type: ChainEditActionType.UPDATE_PRICE_ID, payload: value });
  }, []);

  const onSelectProvider = useCallback((value: string) => {
    if (Object.keys(chainEditInfo.providers).includes(value)) {
      dispatchValidationState({
        type: ValidationStateActionType.UPDATE_PROVIDER_SELECTION,
        payload: {
          needValidating: false,
          isProviderPredefined: true,
          isCurrentEndpoint: value === editInfo.currentProvider
        }
      });

      dispatchChainEditInfo({ type: ChainEditActionType.UPDATE_CURRENT_PROVIDER, payload: value });
    }
  }, [chainEditInfo.providers, editInfo.currentProvider]);

  const _onSaveNetwork = useCallback(() => {
    console.log('on save', validationState, chainEditInfo);
  }, [chainEditInfo, validationState]);

  const handleCreateProvider = useCallback(async (newProvider: string): Promise<string> => {
    if (!_isValidProvider(newProvider)) {
      show('Provider URL requires http/https or wss prefix');

      return '';
    }

    dispatchValidationState({ type: ValidationStateActionType.UPDATE_LOADING, payload: true });
    const resp = await validateNetwork(newProvider, chainEditInfo.slug);

    dispatchValidationState({ type: ValidationStateActionType.UPDATE_LOADING, payload: false });

    if (resp.error || !resp.success) {
      show(getValidateErrorMessage(resp.error));

      return '';
    }

    dispatchValidationState({
      type: ValidationStateActionType.UPDATE_NEW_PROVIDER,
      payload: {
        isProviderConnected: resp.success,
        isCurrentEndpoint: false
      }
    });

    if (resp.success) {
      show('Successfully added a new custom provider');

      const providerCount = Object.values(chainEditInfo.providers).length;
      const newProviderKey = CUSTOM_NETWORK_PREFIX + `${providerCount + 1}`;

      dispatchChainEditInfo({
        type: ChainEditActionType.UPDATE_NEW_PROVIDER,
        payload: {
          newProvider: newProvider,
          newProviderKey: newProviderKey
        }
      });

      return newProviderKey;
    }

    return '';
  }, [chainEditInfo.providers, chainEditInfo.slug, getValidateErrorMessage, show]);

  const isDisableSave = useCallback((): boolean => {
    if (mode === 'create') {
      return !validationState.isValidName || validationState.needValidating || !validationState.isProviderConnected || !validationState.isNewProviderValid || !validationState.isValidBlockExplorer || !validationState.isValidCrowdloanUrl || !chainEditInfo.name || chainEditInfo.name === '';
    } else {
      const isDisabled = !validationState.isValidName || !validationState.isValidSymbol || !validationState.isValidBlockExplorer || !validationState.isValidCrowdloanUrl || validationState.loading;

      if (validationState.isNewProvider) {
        return !validationState.isNewProviderValid || validationState.needValidating || (!validationState.isProviderPredefined && !validationState.isProviderConnected) || isDisabled;
      } else {
        return isDisabled;
      }
    }
  }, [mode, validationState.isValidName, validationState.needValidating, validationState.isProviderConnected, validationState.isNewProviderValid, validationState.isValidBlockExplorer, validationState.isValidCrowdloanUrl, validationState.isValidSymbol, validationState.loading, validationState.isNewProvider, validationState.isProviderPredefined, chainEditInfo.name]);

  const displayChainSpec = useCallback(() => {
    if (chainEditInfo.chainType === ChainEditStandard.EVM) {
      return (
        <div>
          {
            chainSpec.evmChainId !== null && <InputWithLabel
              disabled
              label={t<string>('EVM Chain ID')}
              value={chainSpec?.evmChainId?.toString() || ''}
            />
          }
        </div>
      );
    }

    if (chainEditInfo.chainType === ChainEditStandard.SUBSTRATE) {
      return (
        <div>
          {
            chainSpec.paraId !== null && <InputWithLabel
              disabled
              label={t<string>('paraId')}
              value={chainSpec?.paraId?.toString() || ''}
            />
          }

          {
            chainSpec.genesisHash.length > 0 && <InputWithLabel
              disabled
              label={t<string>('Genesis Hash')}
              value={chainSpec.genesisHash || ''}
            />
          }

          {
            chainSpec.addressPrefix > -1 && <InputWithLabel
              disabled
              label={t<string>('Address Prefix')}
              value={chainSpec.addressPrefix.toString() || ''}
            />
          }

          {
            chainSpec.decimals > -1 && <InputWithLabel
              disabled
              label={t<string>('Decimals')}
              value={chainSpec.decimals.toString() || ''}
            />
          }
        </div>
      );
    }

    return (<div>
      <div>
        {
          chainSpec.paraId !== null && <InputWithLabel
            disabled
            label={t<string>('ParaId')}
            value={chainSpec?.paraId?.toString() || ''}
          />
        }

        {
          chainSpec.evmChainId !== null && <InputWithLabel
            disabled
            label={t<string>('EVM Chain ID')}
            value={chainSpec?.evmChainId?.toString() || ''}
          />
        }

        {
          chainSpec.genesisHash.length > 0 && <InputWithLabel
            disabled
            label={t<string>('Genesis Hash')}
            value={chainSpec.genesisHash || ''}
          />
        }

        {
          chainSpec.addressPrefix > -1 && <InputWithLabel
            disabled
            label={t<string>('Address Prefix')}
            value={chainSpec.addressPrefix.toString() || ''}
          />
        }

        {
          chainSpec.decimals > -1 && <InputWithLabel
            disabled
            label={t<string>('Decimals')}
            value={chainSpec.decimals.toString() || ''}
          />
        }
      </div>
    </div>);
  }, [chainEditInfo.chainType, chainSpec.addressPrefix, chainSpec.decimals, chainSpec.evmChainId, chainSpec.genesisHash, chainSpec.paraId, t]);

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
              options={getAllProviders(chainEditInfo.providers)}
              value={chainEditInfo.currentProvider}
            />
          </div>
        }

        <InputWithLabel
          label={t<string>('Network name (*)')}
          onChange={onChangeChainName}
          value={chainEditInfo.name || ''}
        />

        <InputWithLabel
          label={t<string>('Symbol (*)')}
          onChange={onChangeChainSymbol}
          value={chainEditInfo.symbol || ''}
        />

        {displayChainSpec()}

        {
          chainEditInfo.chainType !== ChainEditStandard.UNKNOWN && <InputWithLabel
            disabled
            label={t<string>('Chain Type')}
            value={chainEditInfo.chainType || ''}
          />
        }

        <div className={'option-toggle-container'}>
          <div>Advanced options</div>
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
              value={chainEditInfo.blockExplorer || ''}
            />

            <InputWithLabel
              label={t<string>('Crowdloan Url (Optional)')}
              onChange={onChangeCrowdloanUrl}
              value={chainEditInfo.crowdloanUrl || ''}
            />

            {
              _isCustomNetwork(chainEditInfo.slug) && <InputWithLabel
                label={t<string>('Price ID (Optional - from CoinGecko)')}
                onChange={onChangePriceId}
                value={chainEditInfo.priceId || ''}
              />
            }
          </div>
        }

        {!validationState.isCurrentEndpoint && validationState.isProviderConnected && validationState.isNewProviderValid && !validationState.loading && <div className={'connect-success'}>Provider connected successfully</div>}

        {!validationState.isCurrentEndpoint && !validationState.isProviderConnected && validationState.isNewProviderValid && !validationState.loading && <div className={'connect-fail'}>{getValidateErrorMessage()}</div>}

        {!validationState.isCurrentEndpoint && validationState.loading && <div className={'connect-info'}>Connecting to the provider...</div>}

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
