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

function ImportEvmNft ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const addTokenRequest = useContext(ConfirmationsQueueContext).addTokenRequest;
  const requests = Object.values(addTokenRequest);
  const currentRequest = requests[0];
  const tokenInfo = currentRequest?.payload;
  const chainOptions = useGetActiveEvmChains();
  const [contractAddress, setContractAddress] = useState(tokenInfo ? tokenInfo.smartContract : '');
  const [name, setName] = useState(tokenInfo ? tokenInfo.symbol : '');
  const [chain, setChain] = useState(tokenInfo?.chain || chainOptions[0].value || '');

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
    setContractAddress(val.toLowerCase());
  }, []);

  useEffect(() => {
    if (contractAddress !== '') {
      if (!isEthereumAddress(contractAddress)) {
        setIsValidContract(false);
        setWarning('Invalid EVM contract address');
      } else {
        validateEvmToken({
          smartContract: contractAddress,
          // @ts-ignore
          chain,
          type: 'erc721'
        })
          .then((resp) => {
            if (resp.isExist) {
              setWarning('This token has already been added');
              setIsValidContract(false);
            } else {
              setName(resp.name);
              setIsValidContract(true);
            }
          })
          .catch(() => {
            setWarning('Invalid contract for the selected chain');
            setIsValidContract(false);
          });
      }
    }
  }, [contractAddress, chain]);

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

    setWarning('');
    setChain(_chain);
  }, []);

  const handleAddToken = useCallback(() => {
    const evmToken = {
      smartContract: contractAddress,
      chain,
      type: 'erc721',
      isCustom: true
    } as CustomEvmToken;

    if (name) {
      evmToken.name = name;
    }

    if (currentRequest) {
      completeConfirmation('addTokenRequest', { id: currentRequest.id, isApproved: true }).catch(console.error);
    }

    upsertEvmToken(evmToken)
      .then((resp) => {
        if (resp) {
          setWarning('Successfully added a NFT collection');
          _goBack();
        } else {
          setWarning('An error has occurred. Please try again later');
        }
      })
      .catch(() => {
        setWarning('An error has occurred. Please try again later');
      });
  }, [_goBack, chain, contractAddress, currentRequest, name]);

  return (
    <div className={className}>
      <Header
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
          isDisabled={!isValidContract || !isValidName || contractAddress === '' || name === '' || chainOptions.length === 0}
          onClick={handleAddToken}
        >
          {t<string>('Add NFT')}
        </Button>
      </div>
    </div>
  );
}

export default React.memo(styled(ImportEvmNft)(({ theme }: Props) => `
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
