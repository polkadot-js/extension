// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, Button, ConfirmationsQueueContext, Dropdown, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetActiveChains from '@subwallet/extension-koni-ui/hooks/screen/import/useGetActiveChains';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation, upsertCustomToken, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import styled from 'styled-components';

import { isEthereumAddress, validateAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string;
}

// Token info logic
enum TokenInfoActionType {
  UPDATE_CHAIN = 'UPDATE_CHAIN',
  UPDATE_CONTRACT = 'UPDATE_CONTRACT',
  UPDATE_METADATA = 'UPDATE_METADATA'
}

interface TokenInfoAction {
  type: TokenInfoActionType,
  payload: Record<string, any> | string
}

const initTokenInfo: CustomToken = {
  chain: '',
  smartContract: '',
  type: CustomTokenType.erc20,
  isCustom: true
};

function tokenInfoReducer (state: CustomToken, action: TokenInfoAction) {
  switch (action.type) {
    case TokenInfoActionType.UPDATE_CHAIN:
      return {
        ...state,
        chain: action.payload as string
      } as CustomToken;
    case TokenInfoActionType.UPDATE_CONTRACT:
      return {
        ...state,
        smartContract: action.payload as string
      };

    case TokenInfoActionType.UPDATE_METADATA: {
      const payload = action.payload as Record<string, any>;

      return {
        ...state,
        symbol: payload.symbol as string || state.symbol,
        decimals: payload.decimals as number || state.decimals
      } as CustomToken;
    }

    default:
      throw new Error();
  }
}

function ImportToken ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const addTokenRequest = useContext(ConfirmationsQueueContext).addTokenRequest;
  const requests = Object.values(addTokenRequest);
  const currentRequest = requests[0];
  const externalTokenInfo = currentRequest?.payload; // import from dapp
  const chainOptions = useGetActiveChains();

  // const [contractAddress, setContractAddress] = useState(externalTokenInfo?.smartContract || '');
  // const [symbol, setSymbol] = useState(externalTokenInfo?.symbol || '');
  // const [decimals, setDecimals] = useState(externalTokenInfo ? String(externalTokenInfo?.decimals) : '');
  // const [chain, setChain] = useState(externalTokenInfo?.chain || chainOptions[0].value || '');

  const [tokenInfo, dispatchTokenInfo] = useReducer(tokenInfoReducer, externalTokenInfo || initTokenInfo);

  const [isValidDecimals, setIsValidDecimals] = useState(true);
  const [isValidContract, setIsValidContract] = useState(true);
  const [isValidSymbol, setIsValidSymbol] = useState(true);
  const [warning, setWarning] = useState('');

  const onChangeContractAddress = useCallback((val: string) => {
    setWarning('');
    dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_CONTRACT, payload: val.toLowerCase() });
    // setContractAddress(val.toLowerCase());
  }, []);

  console.log(validateAddress('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc'));

  useEffect(() => {
    if (tokenInfo.smartContract !== '') {
      if (!isEthereumAddress(tokenInfo.smartContract)) {
        setIsValidContract(false);
        dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_METADATA, payload: { symbol: '', decimals: '' } });
        // setSymbol('');
        // setDecimals('');
        setWarning('Invalid EVM contract address');
      } else {
        validateCustomToken({
          smartContract: tokenInfo.smartContract,
          chain: tokenInfo.chain,
          type: CustomTokenType.erc20 // TODO: check type of token
        })
          .then((resp) => {
            if (resp.isExist) {
              setWarning('This token has already been added');
              setIsValidContract(false);
            } else {
              if (resp.isExist) {
                setWarning('This token has already been added');
                setIsValidContract(false);
              } else {
                // setSymbol(resp.symbol);

                if (resp.decimals) {
                  dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_METADATA, payload: { symbol: resp.symbol, decimals: resp.decimals } });
                  // setDecimals(resp.decimals.toString());
                } else {
                  dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_METADATA, payload: { symbol: resp.symbol } });
                }

                setIsValidSymbol(true);
                setIsValidDecimals(true);
                setIsValidContract(true);
              }
            }
          })
          .catch(() => {
            setWarning('Invalid contract for the selected chain');
            setIsValidContract(false);
          });
      }
    }
  }, [tokenInfo.smartContract, tokenInfo.chain]);

  const onChangeSymbol = useCallback((val: string) => {
    if ((val.length > 11 && val !== '') || (val.split(' ').join('') === '')) {
      setIsValidSymbol(false);
      setWarning('Symbol cannot exceed 11 characters or contain spaces');
    } else {
      setIsValidSymbol(true);
    }

    dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_METADATA, payload: { symbol: val } });
    // setSymbol(val);
  }, []);

  const onChangeDecimals = useCallback((val: string) => {
    const _decimals = parseInt(val);

    if ((isNaN(_decimals) && val !== '') || (val.split(' ').join('') === '')) {
      setIsValidDecimals(false);
      setWarning('Invalid token decimals');
    } else {
      setIsValidDecimals(true);
    }

    dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_METADATA, payload: { decimals: _decimals } });
    // setDecimals(val);
  }, []);

  const onSelectChain = useCallback((val: any) => {
    const _chain = val as string;

    setWarning('');

    dispatchTokenInfo({ type: TokenInfoActionType.UPDATE_CHAIN, payload: { chain: _chain } });
    // setChain(_chain);
  }, []);

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

  const handleAddToken = useCallback(() => {
    setWarning('');

    if (currentRequest) {
      completeConfirmation('addTokenRequest', { id: currentRequest.id, isApproved: true }).catch(console.error);
    }

    upsertCustomToken(tokenInfo)
      .then((resp) => {
        if (resp) {
          setWarning('Successfully added an EVM token'); // TODO: parse warning
          _goBack();
        } else {
          setWarning('An error has occurred. Please try again later');
        }
      })
      .catch(() => {
        setWarning('An error has occurred. Please try again later');
      });
  }, [_goBack, currentRequest, tokenInfo]);

  return (
    <div className={className}>
      <Header
        showCancelButton={false}
        showSettings
        showSubHeader
        subHeaderName={'Import Token'}
      />

      <div className={'import-container'}>
        <InputWithLabel
          label={'Contract Address (*)'}
          onChange={onChangeContractAddress}
          value={tokenInfo.smartContract}
        />

        <div style={{ marginTop: '12px' }}>
          <Dropdown
            label={'Chain (*)'}
            onChange={onSelectChain}
            options={chainOptions}
            value={tokenInfo.chain}
          />
        </div>

        <InputWithLabel
          disabled={true}
          label={'Token Symbol (*)'}
          onChange={onChangeSymbol}
          value={tokenInfo.symbol}
        />

        <InputWithLabel
          disabled={true}
          label={'Token Decimals (*)'}
          onChange={onChangeDecimals}
          value={tokenInfo.decimals?.toString()}
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
          isDisabled={!isValidSymbol || !isValidDecimals || !isValidContract || tokenInfo.smartContract === '' || tokenInfo.symbol === '' || chainOptions.length === 0}
          onClick={handleAddToken}
        >
          {t<string>('Add Token')}
        </Button>
      </div>
    </div>
  );
}

export default React.memo(styled(ImportToken)(({ theme }: Props) => `
  height: 100%;
  display: flex;
  flex-direction: column;

  .import-container {
    padding: 0 15px;
    overflow-y: auto;
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
