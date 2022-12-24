// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AddTokenRequestExternal, ConfirmationsQueueItem } from '@subwallet/extension-base/background/KoniTypes';
import { _AssetType, _ChainAsset } from '@subwallet/extension-koni-base/services/chain-list/types';
import { ValidateCustomTokenResponse } from '@subwallet/extension-koni-base/services/chain-service/types';
import { isValidSubstrateAddress } from '@subwallet/extension-koni-base/utils';
import { ActionContext, Button, ConfirmationsQueueContext, Dropdown, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetContractSupportedChains from '@subwallet/extension-koni-ui/hooks/screen/import/useGetContractSupportedChains';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation, getSupportedContractTypes, upsertCustomToken, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string;
}

// NFT info logic
enum NftInfoActionType {
  UPDATE_CHAIN = 'UPDATE_CHAIN',
  UPDATE_CONTRACT = 'UPDATE_CONTRACT',
  UPDATE_METADATA = 'UPDATE_METADATA',
  RESET_METADATA = 'RESET_METADATA',
  UPDATE_CONTRACT_TYPE = 'UPDATE_CONTRACT_TYPE'
}

interface NftInfoAction {
  type: NftInfoActionType,
  payload: Record<string, any> | string
}

const initNftInfo: _ChainAsset = {
  slug: '',
  symbol: '',
  originChain: '',
  metadata: {
    contractAddress: ''
  },
  name: '',
  decimals: null,
  minAmount: null,
  multiChainAsset: null,
  priceId: null,
  assetType: _AssetType.ERC721
};

interface ValidationState {
  isValidContract: boolean,
  isValidName: boolean,
  warning: string,
  isValidContractType: boolean
}

enum ValidationStateActionType {
  UPDATE_CONTRACT_VALIDATION = 'UPDATE_CONTRACT_VALIDATION',
  UPDATE_NAME_VALIDATION = 'UPDATE_NAME_VALIDATION',
  UPDATE_WARNING = 'UPDATE_WARNING',
  UPDATE_CONTRACT_TYPE_VALIDATION = 'UPDATE_CONTRACT_TYPE_VALIDATION',
  UPDATE_VALIDATION_INFO = 'UPDATE_VALIDATION_INFO'
}

interface ValidationStateAction {
  type: ValidationStateActionType,
  payload: Record<string, any> | boolean | string
}

const initValidationState: ValidationState = {
  isValidContract: false,
  isValidContractType: false,
  isValidName: false,
  warning: ''
};

function validationStateReducer (state: ValidationState, action: ValidationStateAction) {
  switch (action.type) {
    case ValidationStateActionType.UPDATE_NAME_VALIDATION:
      return {
        ...state,
        isValidName: action.payload as boolean
      };
    case ValidationStateActionType.UPDATE_CONTRACT_VALIDATION:
      return {
        ...state,
        isValidContract: action.payload as boolean
      };
    case ValidationStateActionType.UPDATE_WARNING:
      return {
        ...state,
        warning: action.payload as string
      };

    case ValidationStateActionType.UPDATE_VALIDATION_INFO: {
      const { isValidContract, warning } = action.payload as Record<string, any>;

      return {
        ...state,
        isValidContract: isValidContract as boolean,
        warning: warning as string
      };
    }

    case ValidationStateActionType.UPDATE_CONTRACT_TYPE_VALIDATION:
      return {
        ...state,
        isValidContractType: action.payload as boolean
      };

    default:
      throw new Error();
  }
}

function nftInfoReducer (state: _ChainAsset, action: NftInfoAction) {
  switch (action.type) {
    case NftInfoActionType.UPDATE_CHAIN:
      return {
        ...state,
        originChain: action.payload as string
      } as _ChainAsset;
    case NftInfoActionType.UPDATE_CONTRACT:
      return {
        ...state,
        metadata: action.payload as Record<string, any>
      };
    case NftInfoActionType.RESET_METADATA:
      return {
        ...initNftInfo,
        metadata: state.metadata,
        assetType: state.assetType,
        originChain: state.originChain
      };

    case NftInfoActionType.UPDATE_METADATA: {
      const payload = action.payload as Record<string, any>;

      return {
        ...state,
        name: (payload.name || payload.name === '') ? payload.name as string : state.name,
        assetType: payload.type as _AssetType || state.assetType
      } as _ChainAsset;
    }

    case NftInfoActionType.UPDATE_CONTRACT_TYPE:
      return {
        ...state,
        assetType: action.payload as _AssetType
      };

    default:
      throw new Error();
  }
}

function parseAddTokenRequests (requestMap: Record<string, ConfirmationsQueueItem<AddTokenRequestExternal>>) {
  const currentRequest = Object.values(requestMap)[0];

  if (!currentRequest) {
    return {
      requestId: '',
      externalNftInfo: initNftInfo
    };
  }

  const externalTokenInfo = currentRequest?.payload;

  const externalNftInfo: _ChainAsset = {
    slug: '',
    symbol: externalTokenInfo?.symbol || '',
    originChain: externalTokenInfo?.originChain || '',
    metadata: {
      contractAddress: externalTokenInfo?.contractAddress || ''
    },
    name: externalTokenInfo?.name || '',
    decimals: externalTokenInfo?.decimals || null,
    minAmount: null,
    multiChainAsset: null,
    priceId: null,
    assetType: _AssetType.ERC721 // only supports EVM NFTs from external requests for now
  };

  return {
    requestId: currentRequest.id,
    externalNftInfo
  };
}

interface ContractOptions {
  text: string;
  value: string;
}

function getContractOptions (contractTypes: string[]) {
  const result: ContractOptions[] = [];

  contractTypes.forEach((type) => {
    result.push({
      text: type,
      value: type
    });
  });

  return result;
}

function ImportNft ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const addTokenRequest = useContext(ConfirmationsQueueContext).addTokenRequest;
  const { externalNftInfo, requestId } = parseAddTokenRequests(addTokenRequest);
  const { account: currentAccount } = useSelector((state: RootState) => state.currentAccount);

  const [nftInfo, dispatchNftInfo] = useReducer(nftInfoReducer, externalNftInfo || initNftInfo);
  const [validationState, dispatchValidationState] = useReducer(validationStateReducer, initValidationState);

  const [contractOptions, setContractOptions] = useState<ContractOptions[]>([]);
  const chainOptions = useGetContractSupportedChains(nftInfo.assetType);

  // const [isValidContract, setIsValidContract] = useState(true);
  // const [isValidName, setIsValidName] = useState(true);
  // const [warning, setWarning] = useState('');

  useEffect(() => {
    const getContractTypes = async () => {
      const resp = await getSupportedContractTypes();

      const contractOptions = getContractOptions(resp);

      setContractOptions(contractOptions);
    };

    let needUpdate = true;

    if (needUpdate) {
      getContractTypes().then().catch(console.error);
    }

    return () => {
      needUpdate = false;
    };
  }, []);

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      if (requestId !== '') {
        completeConfirmation('addTokenRequest', { id: requestId, isApproved: false }).catch(console.error);
      }

      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    }, [onAction, requestId]
  );

  const onChangeContractAddress = useCallback((val: string) => {
    // setWarning('');
    dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: '' });
    dispatchNftInfo({ type: NftInfoActionType.UPDATE_CONTRACT, payload: { contractAddress: val } }); // ss58 address is case-sensitive but ETH address is not
  }, []);

  useEffect(() => {
    if (nftInfo.metadata?.contractAddress !== '') {
      let tokenType: _AssetType | undefined; // set token type
      const isValidContractCaller = isValidSubstrateAddress(currentAccount?.address as string);

      // TODO: setting tokenType should be done manually by user when there are more token standards
      if (isEthereumAddress(nftInfo.metadata?.contractAddress as string)) {
        tokenType = _AssetType.ERC721;
      } else if (isValidSubstrateAddress(nftInfo.metadata?.contractAddress as string)) {
        tokenType = _AssetType.PSP34;
      }

      if (!tokenType) { // if not valid EVM contract or WASM contract
        // setIsValidContract(false);
        // setWarning('Invalid contract address');
        dispatchValidationState({ type: ValidationStateActionType.UPDATE_VALIDATION_INFO, payload: { isValidContract: false, warning: 'Invalid contract address' } });
        dispatchNftInfo({ type: NftInfoActionType.UPDATE_METADATA, payload: { name: '' } });
      } else {
        validateCustomToken({
          originChain: nftInfo.originChain,
          contractAddress: nftInfo.metadata?.contractAddress as string,
          type: tokenType,
          contractCaller: isValidContractCaller ? currentAccount?.address as string : undefined
        })
          .then((_resp) => {
            const resp = _resp as ValidateCustomTokenResponse;

            if (resp.isExist) {
              // setWarning('This token has already been added');
              // setIsValidContract(false);
              dispatchValidationState({ type: ValidationStateActionType.UPDATE_VALIDATION_INFO, payload: { isValidContract: false, warning: 'This token has already been added' } });
            } else {
              if (resp.contractError) {
                // setIsValidContract(false);
                // setWarning('Invalid contract for the selected chain');

                dispatchValidationState({ type: ValidationStateActionType.UPDATE_VALIDATION_INFO, payload: { isValidContract: false, warning: 'Invalid contract for the selected chain' } });
                dispatchNftInfo({ type: NftInfoActionType.RESET_METADATA, payload: {} });
              } else {
                // setIsValidContract(true);

                dispatchValidationState({ type: ValidationStateActionType.UPDATE_CONTRACT_VALIDATION, payload: true });
                dispatchNftInfo({ type: NftInfoActionType.UPDATE_METADATA, payload: { name: resp.name, type: tokenType } });
              }
            }
          })
          .catch(() => {
            // setWarning('Invalid contract for the selected chain');
            // setIsValidContract(false);

            dispatchValidationState({ type: ValidationStateActionType.UPDATE_VALIDATION_INFO, payload: { isValidContract: false, warning: 'Invalid contract for the selected chain' } });
            dispatchNftInfo({ type: NftInfoActionType.RESET_METADATA, payload: {} });
          });
      }
    }
  }, [currentAccount?.address, nftInfo.metadata?.contractAddress, nftInfo.originChain]);

  const onChangeName = useCallback((val: string) => {
    if (val.split(' ').join('') === '') {
      // setIsValidName(false);
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_NAME_VALIDATION, payload: false });
    } else {
      // setIsValidName(true);
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_NAME_VALIDATION, payload: false });
    }

    dispatchNftInfo({ type: NftInfoActionType.UPDATE_METADATA, payload: { name: val } });
  }, []);

  const onSelectChain = useCallback((val: any) => {
    const _chain = val as string;

    if (_chain !== nftInfo.originChain) {
      // setWarning('');
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: '' });
    }

    dispatchNftInfo({ type: NftInfoActionType.UPDATE_CHAIN, payload: _chain });
  }, [nftInfo.originChain]);

  const onSelectContractType = useCallback((val: any) => {
    const contractType = val as _AssetType;

    if (contractType !== nftInfo.assetType) {
      dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: '' });
    }

    dispatchNftInfo({ type: NftInfoActionType.UPDATE_CONTRACT_TYPE, payload: contractType });
  }, [nftInfo.assetType]);

  const handleAddToken = useCallback(() => {
    // setWarning('');
    dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: '' });

    if (requestId.length > 0) {
      completeConfirmation('addTokenRequest', { id: requestId, isApproved: true }).catch(console.error);
    }

    upsertCustomToken(nftInfo)
      .then((resp) => {
        if (resp) {
          // setWarning(`Successfully added a NFT collection on ${nftInfo.originChain}`);
          dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: `Successfully added a NFT collection on ${nftInfo.originChain}` });
          _goBack();
        } else {
          // setWarning('An error has occurred. Please try again later');
          dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: 'An error has occurred. Please try again later' });
        }
      })
      .catch(() => {
        // setWarning('An error has occurred. Please try again later');
        dispatchValidationState({ type: ValidationStateActionType.UPDATE_WARNING, payload: 'An error has occurred. Please try again later' });
      });
  }, [_goBack, nftInfo, requestId]);

  console.log(nftInfo);

  return (
    <div className={className}>
      <Header
        showSettings
        showSubHeader
        subHeaderName={'Import NFT'}
      />

      <div className={'import-container'}>
        <InputWithLabel
          label={'NFT Contract Address (*)'}
          onChange={onChangeContractAddress}
          value={nftInfo.metadata?.contractAddress as string}
        />

        <div style={{ marginTop: '12px' }}>
          <Dropdown
            label={t<string>('Contract type (*)')}
            onChange={onSelectContractType}
            options={contractOptions}
            value={nftInfo.assetType as string}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <Dropdown
            label={t<string>('Chain (*)')}
            onChange={onSelectChain}
            options={chainOptions}
            value={nftInfo.originChain}
          />
        </div>

        <InputWithLabel
          label={'NFT Collection Name (*)'}
          onChange={onChangeName}
          value={nftInfo.name}
        />
      </div>
      <div className={'add-token-container'}>
        <div className='warning'>{validationState.warning}</div>
        <Button
          className={'cancel-button'}
          onClick={_goBack}
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          className={'add-token-button'}
          isDisabled={!validationState.isValidContractType || !validationState.isValidContract || !validationState.isValidName || nftInfo.metadata?.contractAddress === '' || nftInfo.name === '' || chainOptions.length === 0}
          onClick={handleAddToken}
        >
          {t<string>('Add NFT')}
        </Button>
      </div>
    </div>
  );
}

export default React.memo(styled(ImportNft)(({ theme }: Props) => `
  height: 100%;
  display: flex;
  flex-direction: column;

  .import-container {
    padding: 0 15px;
    overflow-y: auto;
    flex: 1;
  }

  .invalid-input {
    color: red;
    font-size: 12px;
  }

  .cancel-button {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};
    color: ${theme.buttonTextColor2};
    flex: 1 1 40%;
  }

  .add-token-button {
    width: 100%;
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    background-color: ${theme.buttonBackground};
    opacity: 1;
    margin-left: 8px;
    flex: 1 1 40%;
  }

  .add-token-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15px;
    flex-wrap: wrap;
  }

  .warning {
    color: ${theme.iconWarningColor};
    margin-bottom: 10px;
    flex: 1 1 100%;
    text-align: center;
  }
`));
