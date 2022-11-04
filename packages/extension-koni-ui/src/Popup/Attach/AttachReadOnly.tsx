// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountExternalError, AccountExternalErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import ScanAddress from '@subwallet/extension-koni-ui/components/Qr/ScanAddress';
import { SCAN_TYPE } from '@subwallet/extension-koni-ui/constants/qr';
import Address from '@subwallet/extension-koni-ui/partials/Address';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { QrAccount } from '@subwallet/extension-koni-ui/types/scanner';
import { readOnlyScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { AccountContext, AccountInfoEl, ActionContext, ButtonArea, NextStepButton, Theme, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { createAccountExternalV2 } from '../../messaging';
import { Header, Name } from '../../partials';

interface Props extends ThemeProps{
  className?: string;
}

function AttachReadOnly ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const { accounts } = useContext(AccountContext);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const defaultName = useMemo((): string => `Account ${accountsWithoutAll.length + 1}`, [accountsWithoutAll.length]);

  const [isScanning, setIsScanning] = useState<boolean>(false);

  const [address, setAddress] = useState<string | null>(null);
  const [reformatAddress, setReformatAddress] = useState<string>(address || '');
  const [isEthereum, setIsEthereum] = useState(false);
  const [name, setName] = useState<string | null>(defaultName);
  const [errors, setErrors] = useState<AccountExternalError[]>([]);

  const [isBusy, setIsBusy] = useState<boolean>(false);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  const _setAccount = useCallback(
    (qrAccount: QrAccount) => {
      setIsScanning(false);
      setAddress(qrAccount.genesisHash);
      setReformatAddress(qrAccount.content);
      setIsEthereum(qrAccount.isEthereum);
    },
    []
  );

  const _onCreate = useCallback(
    (): void => {
      setIsBusy(true);

      if (reformatAddress && name) {
        createAccountExternalV2({
          name: name,
          address: reformatAddress,
          genesisHash: '',
          isEthereum: isEthereum,
          isAllowed: false,
          isReadOnly: true
        })
          .then((errors) => {
            if (errors.length) {
              setErrors(errors);
            } else {
              window.localStorage.setItem('popupNavigation', '/');
              onAction('/');
            }
          })
          .catch((error: Error) => {
            setErrors([{ code: AccountExternalErrorCode.UNKNOWN_ERROR, message: error.message }]);
            console.error(error);
          })
          .finally(() => {
            setIsBusy(false);
          });
      } else {
        setIsBusy(false);
      }
    },
    [reformatAddress, isEthereum, name, onAction]
  );

  const renderErrors = useCallback((): JSX.Element => {
    if (errors && errors.length) {
      return (
        <>
          {
            errors.map((err, index) =>
              (
                <Warning
                  className='item-error'
                  isDanger
                  key={index}
                >
                  {t<string>(err.message)}
                </Warning>
              )
            )
          }
        </>
      );
    } else {
      return <></>;
    }
  }, [errors, t]);

  const handlerScanError = useCallback((e?: Error) => {
    if (e) {
      setErrors([{ code: AccountExternalErrorCode.UNKNOWN_ERROR, message: e.message }]);
    } else {
      setErrors([]);
    }
  }, []);

  const onChangeAddress = useCallback((val: string | null) => {
    const result = readOnlyScan(val || '');

    setAddress(val);
    setErrors([]);

    if (result) {
      setReformatAddress(result.content);
      setIsEthereum(result.isEthereum);
    } else {
      setReformatAddress('');
    }
  }, []);

  const onCancelScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const onOpenScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  return (
    <div className={className}>
      <Header
        onCancel={onCancelScanning}
        showBackArrow
        showCancelButton={isScanning}
        showSubHeader
        isPreventGoHome={true}
        subHeaderName={t<string>('Address Readonly Account')}
      />
      <div
        className={CN(
          'import-qr-content',
          {
            '-with-padding': !isScanning
          }
        )}
      >
        {isScanning && (
          <>
            <ScanAddress
              onError={handlerScanError}
              onScan={_setAccount}
              type={SCAN_TYPE.READONLY}
            />
            {renderErrors()}
          </>
        )}
        {!isScanning && (
          <>
            <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}>
              <AccountInfoEl
                address={reformatAddress}
                isEthereum={isEthereum}
                isExternal={true}
                isReadOnly={true}
                name={name}
              />
              <Address
                className='name-margin-bottom'
                isFocused
                onChange={onChangeAddress}
                onClickQr={onOpenScanning}
                value={address}
              />
              <Name
                className='name-margin-bottom'
                isFocused
                onChange={setName}
                value={name || ''}
              />
              <div className='error-wrapper'>
                {renderErrors()}
              </div>
            </div>
            <ButtonArea>
              <NextStepButton
                className='next-step-btn'
                isBusy={isBusy}
                isDisabled={!name || !reformatAddress}
                onClick={_onCreate}
              >
                {t<string>('Add the account with identified address')}
              </NextStepButton>
            </ButtonArea>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(styled(AttachReadOnly)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .name-margin-bottom {
    margin-bottom: 10px;
  }

  .import-qr-content {
    flex: 1;
    overflow-y: auto;
  }

  .import-qr-content.-with-padding {
    padding: 25px 15px 15px;
  }


  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }

  .error-wrapper {
    margin: 0 -15px;
  }

  .item-error {
    margin: 10px 15px;
  }
`);
