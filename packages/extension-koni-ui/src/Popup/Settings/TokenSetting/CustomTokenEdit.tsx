// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FUNGIBLE_TOKEN_STANDARDS } from '@subwallet/extension-koni-base/api/tokens';
import { ActionContext, Button, ButtonArea, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { upsertCustomToken } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function CustomTokenEdit ({ className }: Props): React.ReactElement {
  const { show } = useToast();
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const _goBack = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/account/token-setting');
      onAction('/account/token-setting');
    },
    [onAction]
  );

  const _tokenInfo = useSelector((state: RootState) => state.tokenConfigParams.data);
  const [tokenInfo, setTokenInfo] = useState(_tokenInfo);
  const [isValidSymbol, setIsValidSymbol] = useState(true);
  const [isValidDecimals, setIsValidDecimals] = useState(true);
  const [isValidName, setIsValidName] = useState(true);
  const networkJson = useGetNetworkJson(tokenInfo?.chain);

  useEffect(() => {
    if (!_tokenInfo.smartContract) {
      _goBack();
    }
  }, [_goBack, _tokenInfo.smartContract]);

  const _onEditToken = useCallback(() => {
    if (isValidDecimals && isValidSymbol) {
      upsertCustomToken(tokenInfo)
        .then((resp) => {
          if (resp) {
            show('Your changes are saved successfully');
          } else {
            show('An error has occurred. Please try again later');
          }

          _goBack();
        })
        .catch(console.error);
    }
  }, [_goBack, isValidDecimals, isValidSymbol, show, tokenInfo]);

  const onChangeName = useCallback((val: string) => {
    if (val.split(' ').join('') === '') {
      setIsValidName(false);
    } else {
      setIsValidName(true);
    }

    setTokenInfo({
      ...tokenInfo,
      name: val
    });
  }, [tokenInfo]);

  const onChangeSymbol = useCallback((val: string) => {
    if ((val.length > 11 && val !== '') || (val.split(' ').join('') === '')) {
      show('Symbol cannot exceed 11 characters or contain spaces');
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

    if ((isNaN(_decimals) && val !== '') || (val.split(' ').join('') === '')) {
      show('Invalid token decimals');
      setIsValidDecimals(false);
    } else {
      setIsValidDecimals(true);
    }

    setTokenInfo({
      ...tokenInfo,
      decimals: val.split(' ').join('') === '' ? 0 : _decimals
    });
  }, [show, tokenInfo]);

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Configure Token')}
        to='/account/token-setting'
      />

      <div className={className}>
        <InputWithLabel
          disabled={true}
          label={t<string>('Contract Address (*)')}
          value={tokenInfo.smartContract || ''}
        />

        {
          !FUNGIBLE_TOKEN_STANDARDS.includes(tokenInfo.type) &&
          <InputWithLabel
            label={t<string>('Token Name (*)')}
            onChange={onChangeName}
            value={tokenInfo.name || ''}
          />
        }

        {
          FUNGIBLE_TOKEN_STANDARDS.includes(tokenInfo.type) &&
          <InputWithLabel
            disabled={true}
            label={t<string>('Symbol (*)')}
            onChange={onChangeSymbol}
            value={tokenInfo.symbol || ''}
          />
        }

        {
          FUNGIBLE_TOKEN_STANDARDS.includes(tokenInfo.type) &&
          <InputWithLabel
            disabled={true}
            label={t<string>('Decimals (*)')}
            onChange={onChangeDecimals}
            value={tokenInfo?.decimals?.toString() || ''}
          />
        }

        <InputWithLabel
          disabled={true}
          label={t<string>('Chain')}
          value={networkJson?.chain || ''}
        />

        <InputWithLabel
          disabled={true}
          label={t<string>('Token Type')}
          value={tokenInfo?.type?.toUpperCase() || ''}
        />

        <ButtonArea>
          <Button
            className='network-edit-button'
            onClick={_goBack}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='network-edit-button'
            isDisabled={!isValidSymbol || !isValidDecimals || !isValidName || tokenInfo.symbol === '' || tokenInfo.name === ''}
            onClick={_onEditToken}
          >
            {t<string>('Save')}
          </Button>
        </ButtonArea>
      </div>
    </>
  );
}

export default styled(CustomTokenEdit)(({ theme }: Props) => `
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
