// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ActionContext, Button, ButtonArea, InputWithLabel } from '@polkadot/extension-koni-ui/components';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function EvmTokenEdit ({ className }: Props): React.ReactElement {
  const { show } = useToast();
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/evm-token-setting');
      onAction('/account/evm-token-setting');
    },
    [onAction]
  );

  const { tokenConfigParams: { data: _tokenInfo } } = useSelector((state: RootState) => state);
  const [tokenInfo, setTokenInfo] = useState(_tokenInfo);
  const [isValidSymbol, setIsValidSymbol] = useState(true);
  const [isValidDecimals, setIsValidDecimals] = useState(true);

  const _onEditToken = useCallback(() => {
    if (isValidDecimals && isValidSymbol) {
      _goBack();
    }
  }, [_goBack, isValidDecimals, isValidSymbol]);

  const onChangeName = useCallback((val: string) => {
    setTokenInfo({
      ...tokenInfo,
      name: val
    });
  }, [tokenInfo]);

  const onChangeSymbol = useCallback((val: string) => {
    if (val.length > 11 && val !== '') {
      show('Token symbol should not exceed 11 characters');
      setIsValidSymbol(false);
    } else {
      setIsValidSymbol(true);
    }

    setTokenInfo({
      ...tokenInfo,
      symbol: val
    });
  }, [show, tokenInfo]);

  const onChangeDecimals = useCallback((val: string) => {
    const _decimals = parseInt(val);

    if (isNaN(_decimals) && val !== '') {
      show('Token decimals must be an integer');
      setIsValidDecimals(false);
    } else {
      setIsValidDecimals(true);
    }

    setTokenInfo({
      ...tokenInfo,
      decimals: _decimals
    });
  }, [show, tokenInfo]);

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Configure EVM Token')}
        to='/account/evm-token-setting'
      />

      <div className={className}>
        <InputWithLabel
          disabled={true}
          label={t<string>('Contract Address')}
          value={tokenInfo.smartContract || ''}
        />

        <InputWithLabel
          disabled={true}
          label={t<string>('Chain')}
          value={tokenInfo?.chain?.toUpperCase() || ''}
        />

        <InputWithLabel
          label={t<string>('Token Name')}
          onChange={onChangeName}
          value={tokenInfo.name || ''}
        />

        <InputWithLabel
          label={t<string>('Symbol')}
          onChange={onChangeSymbol}
          value={tokenInfo.symbol || ''}
        />

        {
          tokenInfo.type === 'erc20' &&
          <InputWithLabel
            label={t<string>('Decimals')}
            onChange={onChangeDecimals}
            value={tokenInfo?.decimals?.toString() || ''}
          />
        }

        <ButtonArea>
          <Button
            className='network-edit-button'
            onClick={_goBack}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='network-edit-button'
            isDisabled={!isValidSymbol || !isValidDecimals}
            onClick={_onEditToken}
          >
            {t<string>('Save')}
          </Button>
        </ButtonArea>
      </div>
    </>
  );
}

export default styled(EvmTokenEdit)(({ theme }: Props) => `
  padding: 0 15px 15px;
  flex: 1;
  overflow-y: auto;

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
