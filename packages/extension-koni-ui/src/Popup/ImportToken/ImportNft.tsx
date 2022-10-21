// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import { isValidSubstrateAddress } from '@subwallet/extension-koni-base/utils';
import { ActionContext, Button, ConfirmationsQueueContext, Dropdown, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetContractSupportedChains from '@subwallet/extension-koni-ui/hooks/screen/import/useGetContractSupportedChains';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation, upsertCustomToken, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
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
  RESET_METADATA = 'RESET_METADATA'
}

interface NftInfoAction {
  type: NftInfoActionType,
  payload: Record<string, any> | string
}

const initNftInfo: CustomToken = {
  chain: '',
  smartContract: '',
  type: CustomTokenType.erc721,
  isCustom: true,
  name: ''
};

function nftInfoReducer (state: CustomToken, action: NftInfoAction) {
  switch (action.type) {
    case NftInfoActionType.UPDATE_CHAIN:
      return {
        ...state,
        chain: action.payload as string
      } as CustomToken;
    case NftInfoActionType.UPDATE_CONTRACT:
      return {
        ...state,
        smartContract: action.payload as string
      };
    case NftInfoActionType.RESET_METADATA:
      return {
        ...initNftInfo,
        smartContract: state.smartContract,
        type: state.type,
        chain: state.chain
      };

    case NftInfoActionType.UPDATE_METADATA: {
      const payload = action.payload as Record<string, any>;

      return {
        ...state,
        name: (payload.name || payload.name === '') ? payload.name as string : state.name,
        type: payload.type as CustomTokenType || state.type
      } as CustomToken;
    }

    default:
      throw new Error();
  }
}

function ImportNft ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const addTokenRequest = useContext(ConfirmationsQueueContext).addTokenRequest;
  const requests = Object.values(addTokenRequest);
  const currentRequest = requests[0];
  const externalTokenInfo = currentRequest?.payload;
  const chainOptions = useGetContractSupportedChains();
  const { account: currentAccount } = useSelector((state: RootState) => state.currentAccount);

  const [nftInfo, dispatchNftInfo] = useReducer(nftInfoReducer, externalTokenInfo || { ...initNftInfo, chain: chainOptions[0].value || '' });

  const [isValidContract, setIsValidContract] = useState(true);
  const [isValidName, setIsValidName] = useState(true);
  const [warning, setWarning] = useState('');

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      if (currentRequest) {
        completeConfirmation('addTokenRequest', { id: currentRequest.id, isApproved: false }).catch(console.error);
      }

      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [currentRequest, onAction]
  );

  const onChangeContractAddress = useCallback((val: string) => {
    setWarning('');
    dispatchNftInfo({ type: NftInfoActionType.UPDATE_CONTRACT, payload: val }); // ss58 address is case-sensitive but ETH address is not
  }, []);

  useEffect(() => {
    if (nftInfo.smartContract !== '') {
      let tokenType: CustomTokenType | undefined; // set token type
      const isValidContractCaller = isValidSubstrateAddress(currentAccount?.address as string);

      // TODO: this should be done manually by user when there are more token standards
      if (isEthereumAddress(nftInfo.smartContract)) {
        tokenType = CustomTokenType.erc721;
      } else if (isValidSubstrateAddress(nftInfo.smartContract)) {
        tokenType = CustomTokenType.psp34;
      }

      if (!tokenType) { // if not valid EVM contract or WASM contract
        setIsValidContract(false);
        dispatchNftInfo({ type: NftInfoActionType.UPDATE_METADATA, payload: { name: '' } });
        setWarning('Invalid contract address');
      } else {
        validateCustomToken({
          smartContract: nftInfo.smartContract,
          chain: nftInfo.chain,
          type: tokenType,
          contractCaller: isValidContractCaller ? currentAccount?.address as string : undefined
        })
          .then((resp) => {
            if (resp.isExist) {
              setWarning('This token has already been added');
              setIsValidContract(false);
            } else {
              if (resp.contractError) {
                setIsValidContract(false);
                setWarning('Invalid contract for the selected chain');

                dispatchNftInfo({ type: NftInfoActionType.RESET_METADATA, payload: {} });
              } else {
                setIsValidContract(true);
                dispatchNftInfo({ type: NftInfoActionType.UPDATE_METADATA, payload: { name: resp.name, type: tokenType } });
              }
            }
          })
          .catch(() => {
            setWarning('Invalid contract for the selected chain');
            setIsValidContract(false);

            dispatchNftInfo({ type: NftInfoActionType.RESET_METADATA, payload: {} });
          });
      }
    }
  }, [nftInfo.smartContract, nftInfo.chain, currentAccount?.address]);

  const onChangeName = useCallback((val: string) => {
    if (val.split(' ').join('') === '') {
      setIsValidName(false);
    } else {
      setIsValidName(true);
    }

    dispatchNftInfo({ type: NftInfoActionType.UPDATE_METADATA, payload: { name: val } });
  }, []);

  const onSelectChain = useCallback((val: any) => {
    const _chain = val as string;

    if (_chain !== nftInfo.chain) {
      setWarning('');
    }

    dispatchNftInfo({ type: NftInfoActionType.UPDATE_CHAIN, payload: _chain });
  }, [nftInfo.chain]);

  const handleAddToken = useCallback(() => {
    setWarning('');

    if (currentRequest) {
      completeConfirmation('addTokenRequest', { id: currentRequest.id, isApproved: true }).catch(console.error);
    }

    upsertCustomToken(nftInfo)
      .then((resp) => {
        if (resp) {
          setWarning(`Successfully added a NFT collection on ${nftInfo.chain}`);
          _goBack();
        } else {
          setWarning('An error has occurred. Please try again later');
        }
      })
      .catch(() => {
        setWarning('An error has occurred. Please try again later');
      });
  }, [_goBack, currentRequest, nftInfo]);

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
          value={nftInfo.smartContract}
        />

        <div style={{ marginTop: '12px' }}>
          <Dropdown
            label={'Chain (*)'}
            onChange={onSelectChain}
            options={chainOptions}
            value={nftInfo.chain}
          />
        </div>

        <InputWithLabel
          label={'NFT Collection Name (*)'}
          onChange={onChangeName}
          value={nftInfo.name}
        />
      </div>
      <div className={'add-token-container'}>
        <div className='warning'>{warning}</div>
        <Button
          className={'cancel-button'}
          onClick={_goBack}
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          className={'add-token-button'}
          isDisabled={!isValidContract || !isValidName || nftInfo.smartContract === '' || nftInfo.name === '' || chainOptions.length === 0}
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
