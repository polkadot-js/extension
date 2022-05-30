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

function ImportEvmNft ({ className = '' }: Props): React.ReactElement<Props> {
  const [contractAddress, setContractAddress] = useState('');
  const [name, setName] = useState('');
  const chainOptions = useGetActiveEvmChains();
  const [chain, setChain] = useState(chainOptions[0].value);

  const [isValidContract, setIsValidContract] = useState(true);
  const [isValidName, setIsValidName] = useState(true);
  const { show } = useToast();

  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [onAction]
  );

  const onChangeContractAddress = useCallback((val: string) => {
    setContractAddress(val.toLowerCase());
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
          type: 'erc721'
        })
          .then((resp) => {
            if (resp.isExist) {
              show('This token has already been added');
              setIsValidContract(false);
            } else {
              setName(resp.name);
              setIsValidContract(true);
            }
          })
          .catch(() => {
            show('Invalid contract for the selected chain');
            setIsValidContract(false);
          });
      }
    }
  }, [contractAddress, chain, show]);

  const onChangeName = useCallback((val: string) => {
    if (val.split(' ').join('') === '') {
      setIsValidName(false);
    } else {
      setIsValidName(true);
    }

    setName(val);
  }, []);

  const onSelectChain = useCallback((val: any) => {
    const _chain = val as string;

    setChain(_chain);
  }, []);

  const handleAddToken = useCallback(() => {
    const evmToken = {
      smartContract: contractAddress,
      chain,
      type: 'erc721'
    } as CustomEvmToken;

    if (name) {
      evmToken.name = name;
    }

    upsertEvmToken(evmToken)
      .then((resp) => {
        if (resp) {
          show('Successfully added a NFT collection');
          _goBack();
        } else {
          show('An error has occurred. Please try again later');
        }
      })
      .catch(() => {
        show('An error has occurred. Please try again later');
      });
  }, [_goBack, chain, contractAddress, name, show]);

  return (
    <div className={className}>
      <Header
        showCancelButton
        showSettings
        showSubHeader
        subHeaderName={'Import EVM NFT'}
      />

      <div className={'import-container'}>
        <InputWithLabel
          label={'NFT Contract Address (*)'}
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
          label={'NFT Collection Name (*)'}
          onChange={onChangeName}
          value={name}
        />

        <div className={'add-token-container'}>
          <Button
            className={'add-token-button'}
            isDisabled={!isValidContract || !isValidName || contractAddress === '' || name === '' || chainOptions.length === 0}
            onClick={handleAddToken}
          >
            Add NFT collection
          </Button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(styled(ImportEvmNft)(({ theme }: Props) => `
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
