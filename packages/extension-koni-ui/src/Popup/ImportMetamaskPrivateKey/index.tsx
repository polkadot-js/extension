/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import HeaderWithSteps from '@polkadot/extension-koni-ui/partials/HeaderWithSteps';
import MetamaskPrivateKeyImport from '@polkadot/extension-koni-ui/Popup/ImportMetamaskPrivateKey/MetamaskPrivateKeyImport';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { KeypairType } from '@polkadot/util-crypto/types';

import { AccountContext, ActionContext } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuriV2 } from '../../messaging';

export interface AccountInfo {
  address: string;
  genesis?: string;
  suri: string;
}

interface Props extends ThemeProps {
  className?: string;
}

const importMetamaskTypes: Array<KeypairType> = ['ethereum'];

function ImportMetamaskPrivateKey ({ className = '' }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const name = `Account ${accountsWithoutAll.length + 1}`;
  const evmName = `Account ${accountsWithoutAll.length + 1} - EVM`;
  const [step1, setStep1] = useState(true);

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onCreate = useCallback((name: string, password: string): void => {
    // this should always be the case
    if (name && password && account) {
      setIsBusy(true);

      createAccountSuriV2(name, password, account.suri, importMetamaskTypes, account.genesis)
        .then(() => {
          window.localStorage.setItem('popupNavigation', '/');
          onAction('/');
        })
        .catch((error): void => {
          setIsBusy(false);
          console.error(error);
        });
    }
  }, [account, onAction]);

  const _onNextStep = useCallback(
    () => setStep1(false),
    []
  );

  const _onBackClick = useCallback(
    () => setStep1(true),
    []
  );

  return (
    <>
      <HeaderWithSteps
        isBusy={isBusy}
        onBackClick={_onBackClick}
        step={step1 ? 1 : 2}
        text={t<string>('Import account from Metamask private key')}
      />
      {step1
        ? (
          <MetamaskPrivateKeyImport
            account={account}
            className='import-seed-content-wrapper'
            name={evmName}
            onAccountChange={setAccount}
            onNextStep={_onNextStep}
            type={importMetamaskTypes[0]}
          />
        )
        : (
          <AccountNamePasswordCreation
            buttonLabel={t<string>('Add the account with the supplied private key')}
            className='koni-import-seed-content'
            evmAddress={account?.address}
            evmName={evmName}
            isBusy={isBusy}
            keyTypes={['ethereum']}
            name={name}
            onCreate={_onCreate}
          />
        )
      }
    </>
  );
}

export default styled(ImportMetamaskPrivateKey)`
`;
