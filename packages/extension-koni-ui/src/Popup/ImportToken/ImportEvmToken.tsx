// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, Button, ConfirmationsQueueContext, Dropdown, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetActiveEvmChains from '@subwallet/extension-koni-ui/hooks/screen/import/useGetActiveEvmChains';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation, upsertEvmToken, validateEvmToken } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string;
}

function ImportEvmToken ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const addTokenRequest = useContext(ConfirmationsQueueContext).addTokenRequest;
  const requests = Object.values(addTokenRequest);
  const currentRequest = requests[0];
  const tokenInfo = currentRequest?.payload;
  const chainOptions = useGetActiveEvmChains();
  const [contractAddress, setContractAddress] = useState(tokenInfo?.smartContract || '');
  const [symbol, setSymbol] = useState(tokenInfo?.symbol || '');
  const [decimals, setDecimals] = useState(String(tokenInfo?.decimals) || '');
  const [chain, setChain] = useState(tokenInfo?.chain || '');

  const [isValidDecimals, setIsValidDecimals] = useState(true);
  const [isValidContract, setIsValidContract] = useState(true);
  const [isValidSymbol, setIsValidSymbol] = useState(true);
  const [warning, setWarning] = useState('');

  const onChangeContractAddress = useCallback((val: string) => {
    setWarning('');
    setContractAddress(val.toLowerCase());
  }, []);

  useEffect(() => {
    if (contractAddress !== '') {
      if (!isEthereumAddress(contractAddress)) {
        setIsValidContract(false);
        setSymbol('');
        setDecimals('');
        setWarning('Invalid EVM contract address');
      } else {
        validateEvmToken({
          smartContract: contractAddress,
          // @ts-ignore
          chain,
          type: 'erc20'
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
                setSymbol(resp.symbol);

                if (resp.decimals) {
                  setDecimals(resp.decimals.toString());
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
  }, [contractAddress, chain]);

  const onChangeSymbol = useCallback((val: string) => {
    if ((val.length > 11 && val !== '') || (val.split(' ').join('') === '')) {
      setIsValidSymbol(false);
      setWarning('Symbol cannot exceed 11 characters or contain spaces');
    } else {
      setIsValidSymbol(true);
    }

    setSymbol(val);
  }, []);

  const onChangeDecimals = useCallback((val: string) => {
    const _decimals = parseInt(val);

    if ((isNaN(_decimals) && val !== '') || (val.split(' ').join('') === '')) {
      setIsValidDecimals(false);
      setWarning('Invalid token decimals');
    } else {
      setIsValidDecimals(true);
    }

    setDecimals(val);
  }, []);

  const onSelectChain = useCallback((val: any) => {
    const _chain = val as string;

    setWarning('');
    setChain(_chain);
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
    const evmToken = {
      smartContract: contractAddress,
      chain,
      decimals: parseInt(decimals),
      type: 'erc20',
      isCustom: true
    } as CustomEvmToken;

    if (symbol) {
      evmToken.symbol = symbol;
    }

    setWarning('');

    if (currentRequest) {
      completeConfirmation('addTokenRequest', { id: currentRequest.id, isApproved: true }).catch(console.error);
    }

    upsertEvmToken(evmToken)
      .then((resp) => {
        if (resp) {
          setWarning('Successfully added an EVM token');
          _goBack();
        } else {
          setWarning('An error has occurred. Please try again later');
        }
      })
      .catch(() => {
        setWarning('An error has occurred. Please try again later');
      });
  }, [_goBack, chain, contractAddress, currentRequest, decimals, symbol]);

  return (
    <div className={className}>
      <Header
        showCancelButton={false}
        showSettings
        showSubHeader
        subHeaderName={'Import EVM Token'}
      />

      <div className={'import-container'}>
        <InputWithLabel
          label={'Token Contract Address (*)'}
          onChange={onChangeContractAddress}
          value={contractAddress}
        />

        <div style={{ marginTop: '12px' }}>
          <Dropdown
            label={'Chain (*)'}
            onChange={onSelectChain}
            options={chainOptions}
            value={chain}
          />
        </div>

        <InputWithLabel
          disabled={true}
          label={'Token Symbol (*)'}
          onChange={onChangeSymbol}
          value={symbol}
        />

        <InputWithLabel
          disabled={true}
          label={'Token Decimals (*)'}
          onChange={onChangeDecimals}
          value={decimals}
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
          isDisabled={!isValidSymbol || !isValidDecimals || !isValidContract || contractAddress === '' || symbol === '' || chainOptions.length === 0}
          onClick={handleAddToken}
        >
          {t<string>('Add Token')}
        </Button>
      </div>
    </div>
  );
}

export default React.memo(styled(ImportEvmToken)(({ theme }: Props) => `
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
