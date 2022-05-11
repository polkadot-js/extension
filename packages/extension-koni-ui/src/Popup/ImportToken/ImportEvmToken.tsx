// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { CustomEvmToken } from '@polkadot/extension-base/background/KoniTypes';
import { ActionContext, Button, Dropdown, InputWithLabel } from '@polkadot/extension-koni-ui/components';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import { upsertEvmToken, validateEvmToken } from '@polkadot/extension-koni-ui/messaging';
import { Header } from '@polkadot/extension-koni-ui/partials';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string;
}

const CHAIN_OPTIONS = [
  {
    text: 'Astar',
    value: 'astarEvm'
  },
  {
    text: 'Moonbeam',
    value: 'moonbeam'
  },
  {
    text: 'Moonriver',
    value: 'moonriver'
  },
  {
    text: 'Moonbase Alpha',
    value: 'moonbase'
  },
  {
    text: 'Shiden',
    value: 'shidenEvm'
  }
];

function ImportEvmToken ({ className = '' }: Props): React.ReactElement<Props> {
  const [contractAddress, setContractAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');
  const [chain, setChain] = useState(CHAIN_OPTIONS[0].value);

  const [isValidDecimals, setIsValidDecimals] = useState(true);
  const [isValidContract, setIsValidContract] = useState(true);
  const [isValidSymbol, setIsValidSymbol] = useState(true);

  const { show } = useToast();

  const onChangeContractAddress = useCallback((val: string) => {
    setContractAddress(val);
  }, []);

  useEffect(() => {
    if (contractAddress !== '') {
      if (!isEthereumAddress(contractAddress)) {
        setIsValidContract(false);
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
              setSymbol(resp.symbol);

              if (resp.decimals) {
                setDecimals(resp.decimals.toString());
              }

              setIsValidContract(true);
            }
          })
          .catch(() => {
            show('Invalid contract for the selected chain');
          });
      }
    }
  }, [contractAddress, chain, show]);

  const onChangeSymbol = useCallback((val: string) => {
    if (val.length > 11 && val !== '') {
      setIsValidSymbol(false);
    } else {
      setIsValidSymbol(true);
    }

    setSymbol(val);
  }, []);

  const onChangeDecimals = useCallback((val: string) => {
    const _decimals = parseInt(val);

    if (isNaN(_decimals) && val !== '') {
      setIsValidDecimals(false);
    } else {
      setIsValidDecimals(true);
      setDecimals(val);
    }
  }, []);

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
            options={CHAIN_OPTIONS}
            value={chain}
          />
        </div>

        <InputWithLabel
          label={'Token Symbol (*)'}
          onChange={onChangeSymbol}
          value={symbol}
        />
        {
          !isValidSymbol && <div className={'invalid-input'}>Token symbol should not exceed 11 characters</div>
        }

        <InputWithLabel
          label={'Token Decimals'}
          onChange={onChangeDecimals}
          value={decimals}
        />
        {
          !isValidDecimals && <div className={'invalid-input'}>Token decimals must be an integer</div>
        }

        <div className={'add-token-container'}>
          <Button
            className={'add-token-button'}
            isDisabled={!isValidSymbol || !isValidDecimals || !isValidContract || contractAddress === '' || symbol === ''}
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
