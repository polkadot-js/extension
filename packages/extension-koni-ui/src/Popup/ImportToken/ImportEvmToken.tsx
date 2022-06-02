// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, Button, Dropdown, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetActiveEvmChains from '@subwallet/extension-koni-ui/hooks/screen/import/useGetActiveEvmChains';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import { upsertEvmToken, validateEvmToken } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string;
}

function ImportEvmToken ({ className = '' }: Props): React.ReactElement<Props> {
  const [contractAddress, setContractAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');
  const chainOptions = useGetActiveEvmChains();
  const [chain, setChain] = useState(chainOptions[0].value);

  const [isValidDecimals, setIsValidDecimals] = useState(true);
  const [isValidContract, setIsValidContract] = useState(true);
  const [isValidSymbol, setIsValidSymbol] = useState(true);

  const { show } = useToast();

  const onChangeContractAddress = useCallback((val: string) => {
    setContractAddress(val.toLowerCase());
  }, []);

  useEffect(() => {
    if (contractAddress !== '') {
      if (!isEthereumAddress(contractAddress)) {
        setIsValidContract(false);
        setSymbol('');
        setDecimals('');
        show('Invalid EVM contract address');
      } else {
        validateEvmToken({
          smartContract: contractAddress,
          // @ts-ignore
          chain,
          type: 'erc20'
        })
          .then((resp) => {
            if (resp.isExist) {
              show('This token has already been added');
              setIsValidContract(false);
            } else {
              if (resp.isExist) {
                show('This token has already been added');
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
            show('Invalid contract for the selected chain');
            setIsValidContract(false);
          });
      }
    }
  }, [contractAddress, chain, show]);

  const onChangeSymbol = useCallback((val: string) => {
    if ((val.length > 11 && val !== '') || (val.split(' ').join('') === '')) {
      setIsValidSymbol(false);
      show('Symbol cannot exceed 11 characters or contain spaces');
    } else {
      setIsValidSymbol(true);
    }

    setSymbol(val);
  }, [show]);

  const onChangeDecimals = useCallback((val: string) => {
    const _decimals = parseInt(val);

    if ((isNaN(_decimals) && val !== '') || (val.split(' ').join('') === '')) {
      setIsValidDecimals(false);
      show('Invalid token decimals');
    } else {
      setIsValidDecimals(true);
    }

    setDecimals(val);
  }, [show]);

  const onSelectChain = useCallback((val: any) => {
    const _chain = val as string;

    setChain(_chain);
  }, []);

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [onAction]
  );

  const handleAddToken = useCallback(() => {
    const evmToken = {
      smartContract: contractAddress,
      chain,
      decimals: parseInt(decimals),
      type: 'erc20'
    } as CustomEvmToken;

    if (symbol) {
      evmToken.symbol = symbol;
    }

    upsertEvmToken(evmToken)
      .then((resp) => {
        if (resp) {
          show('Successfully added an EVM token');
          _goBack();
        } else {
          show('An error has occurred. Please try again later');
        }
      })
      .catch(() => {
        show('An error has occurred. Please try again later');
      });
  }, [_goBack, chain, contractAddress, decimals, show, symbol]);

  return (
    <div className={className}>
      <Header
        showCancelButton
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

        <div className={'add-token-container'}>
          <Button
            className={'add-token-button'}
            isDisabled={!isValidSymbol || !isValidDecimals || !isValidContract || contractAddress === '' || symbol === '' || chainOptions.length === 0}
            onClick={handleAddToken}
          >
            Add Custom Token
          </Button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(styled(ImportEvmToken)(({ theme }: Props) => `
  .import-container {
    height: 472px;
    padding: 0 15px;
    overflow-y: auto;
  }

  .invalid-input {
    color: red;
    font-size: 12px;
  }

  .add-token-button {
    width: 100%;
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    background-color: ${theme.buttonBackground};
    opacity: 1;
  }

  .add-token-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 25px;
    margin-bottom: 15px;
  }
`));
