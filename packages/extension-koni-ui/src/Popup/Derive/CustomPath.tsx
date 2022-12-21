// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button, Checkbox, InputWithLabel, Warning } from '@subwallet/extension-koni-ui/components';
import AccountInfo from '@subwallet/extension-koni-ui/components/AccountInfo';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import useGetNewAccountDefaultName from '@subwallet/extension-koni-ui/hooks/useGetNewAccountDefaultName';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { validateDerivePathV2 } from '@subwallet/extension-koni-ui/messaging';
import { Name } from '@subwallet/extension-koni-ui/partials';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DeriveAccount } from '@subwallet/extension-koni-ui/types/derive';
import { nextDerivationPath } from '@subwallet/extension-koni-ui/util/nextDerivationPath';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  parentAddress: string;
  setStep: (val: number) => void;
  setDeriveAccounts: (values: DeriveAccount[]) => void;
}

let timeout: NodeJS.Timeout | undefined;

const CustomPath = ({ className, parentAddress, setDeriveAccounts, setStep }: Props) => {
  const { t } = useTranslation();

  const { accounts } = useContext(AccountContext);

  const parentAccount = useGetAccountByAddress(parentAddress);

  const defaultPath = useMemo(() => nextDerivationPath(accounts, parentAddress), [accounts, parentAddress]);
  const defaultName = useGetNewAccountDefaultName();
  const isEvm = parentAccount?.type === EVM_ACCOUNT_TYPE;

  const [path, setPath] = useState<string>(defaultPath);
  const [delay, setDelay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<{ address: string, suri: string }>({ address: '', suri: '' });
  const [name, setName] = useState<string | null>(defaultName);
  const [error, setError] = useState('');
  const [isConnectWhenCreate, setIsConnectWhenCreate] = useState<boolean>(true);

  const onChangePath = useCallback((value?: string) => {
    clearTimeout(timeout);
    setDelay(true);
    setError('');
    setPath(value || '');
    timeout = setTimeout(() => {
      setDelay(false);
    }, 500);
  }, []);

  const pathFormat = useMemo((): string => {
    switch (parentAccount?.type) {
      case 'sr25519':
        return '//hard/soft';
      case 'ethereum':
        return '//index';
      default:
        return '//hard';
    }
  }, [parentAccount]);

  const onSubmit = useCallback(() => {
    if (name) {
      setDeriveAccounts([{
        name: name,
        address: accountInfo.address,
        suri: accountInfo.suri
      }]);
      setStep(3);
    }
  }, [name, setDeriveAccounts, accountInfo, setStep]);

  useEffect(() => {
    setPath(defaultPath);
  }, [defaultPath]);

  useEffect(() => {
    let amount = true;

    if (!delay) {
      setLoading(true);
      validateDerivePathV2({
        suri: path,
        parentAddress: parentAddress
      })
        .then((res) => {
          if (amount) {
            setAccountInfo({
              suri: res.suri,
              address: res.address
            });
            setError('');
            setLoading(false);
          }
        })
        .catch((e) => {
          console.log(e);

          if (amount) {
            setAccountInfo({
              suri: '',
              address: ''
            });
            setError((e as Error).message);
            setLoading(false);
          }
        });
    }

    return () => {
      amount = false;
    };
  }, [delay, parentAddress, path]);

  return (
    <div className={CN(className)}>
      <div className={CN('body-container')}>
        <div className={CN('info-container')}>
          <AccountInfo
            address={accountInfo.address}
            className='derive-account-info'
            name={name}
            parentName={parentAccount?.name}
            showCopyBtn={false}
            suri={accountInfo.suri}
          />
          {
            (delay || loading) && (
              <Spinner className='loading-container' />
            )
          }
        </div>
        <Name
          className='name-margin-bottom'
          isFocused
          label={t('Derived Account Name')}
          onChange={setName}
          value={name}
        />
        <InputWithLabel
          data-input-suri
          isError={!!error || !path}
          label={t('Derivation Path')}
          labelQuestionIcon={isEvm}
          labelTooltip={t('The derivation path must be in numbers')}
          onChange={onChangePath}
          placeholder={pathFormat}
          value={path}
        />
        {
          error && (
            <Warning
              className='create-derive-warning'
              isBelowInput
              isDanger
            >
              {error}
            </Warning>
          )
        }
        <Checkbox
          checked={isConnectWhenCreate}
          label={t<string>('Auto connect to all DApps after creating')}
          onChange={setIsConnectWhenCreate}
        />
      </div>
      <div className={CN('footer-container')}>
        <Button
          className='next-step-btn'
          data-button-action='create derived account'
          isDisabled={!!error || !path || !name}
          onClick={onSubmit}
        >
          {t<string>('Next')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(CustomPath)(({ theme }: Props) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .info-container {
    position: relative;

    .derive-account-info {
      padding: 2px 14px;
      border: 2px solid ${theme.borderColor2};
      border-radius: 8px;
    }

    .loading-container {
      right: 10px;
      top: 2px;
      margin: 0;
      position: absolute;
      left: unset;
    }
  }

  .create-derive-warning {
    margin-top: 10px;
  }

  .body-container {
    flex: 1;
    position: relative;
    padding: 0 15px;
    margin: 0 -15px;
    border-bottom: solid 1px ${theme.boxBorderColor};
  }

  .footer-container {
    margin: 20px 0 5px;
  }
`));
