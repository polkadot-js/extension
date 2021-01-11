// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AccountContext, ActionContext, Address, BackButton, ButtonArea, InputWithLabel, NextStepButton, TextAreaWithLabel, VerticalSpace, Warning } from '../components';
import AccountName from '../components/AccountNamePasswordCreate';
import useTranslation from '../hooks/useTranslation';
import { createAccountSuri, validateSeed } from '../messaging';
import { HeaderWithSteps } from '../partials';

interface Props {
  className? : string;
}

function Import ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [step1, setStep1] = useState(true);
  const [advanced, setAdvances] = useState(false);
  const [error, setError] = useState('');

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      setAccount(null);

      return;
    }

    const suri = `${seed || ''}${path || ''}`;

    validateSeed(suri).then((newAccount) => {
      setError('');
      setAccount(newAccount);
    }).catch(() => {
      setAccount(null);
      setError(path
        ? t<string>('Invalid mnemonic seed or derivation path')
        : t<string>('Invalid mnemonic seed')
      );
    });
  }, [t, seed, path]);

  const _onCreate = useCallback((name: string, password: string): void => {
    // this should always be the case
    if (name && password && account) {
      setIsBusy(true);

      createAccountSuri(name, password, account.suri)
        .then(() => onAction('/'))
        .catch((error): void => {
          setIsBusy(false);
          console.error(error);
        });
    }
  }, [account, onAction]);

  const _onNextStep = useCallback(() => {
    setStep1(false);
  },
  []
  );

  const _onBackClick = useCallback(() => {
    setStep1(true);
  }, []);

  const _onToggleAdvanced = useCallback(() => {
    setAdvances(!advanced);
  }, [advanced]);

  return (
    <>
      <HeaderWithSteps
        step={step1 ? 1 : 2}
        text={t<string>('Import account')}
      />
      <div>
        <Address
          address={account?.address}
          name={name}
        />
      </div>
      {step1
        ? <>
          <div className={className}>
            <TextAreaWithLabel
              className='seedInput'
              isError={!!error}
              isFocused
              label={t<string>('existing 12 or 24-word mnemonic seed')}
              onChange={setSeed}
              rowsCount={2}
              value={seed || ''}
            />
            {!!error && !seed && (
              <Warning
                className='seedError'
                isBelowInput
                isDanger
              >
                {t<string>('Mnemonic needs to contain 12, 15, 18, 21, 24 words')}
              </Warning>
            )}
            <div
              className='advancedToggle'
              onClick={_onToggleAdvanced}
            >
              <FontAwesomeIcon icon={advanced ? faCaretDown : faCaretRight}/>
              <span>{t<string>('advanced')}</span>
            </div>
            { advanced && (
              <InputWithLabel
                className='derivationPath'
                isError={!!path && !!error}
                label={t<string>('derivation path')}
                onChange={setPath}
                value={path || ''}
              />
            )}
            {!!error && !!seed && (
              <Warning
                isDanger
              >
                {error}
              </Warning>
            )}
          </div>
          <VerticalSpace />
          <ButtonArea>
            {!step1 && <BackButton onClick={_onBackClick}/>}
            <NextStepButton
              isBusy={isBusy}
              isDisabled={!account || !!error}
              onClick={_onNextStep}
            >
              {t<string>('Next')}
            </NextStepButton>
          </ButtonArea>
        </>
        : <AccountName
          address={account?.address || ''}
          isBusy={isBusy}
          onBackClick={_onBackClick}
          onCreate={_onCreate}
          onNameChange={setName}

          // : t<string>('Add the account with the supplied seed')

        />

      }
    </>
  );
}

export default styled(Import)(({ theme }: ThemeProps) => `
  .advancedToggle {
    color: ${theme.textColor};
    cursor: pointer;
    line-height: 14px;
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;

    > span {
      font-size: 10px;
      margin-left: .5rem;
      vertical-align: middle;
    }
  }

  .seedInput {
    margin-bottom: 16px;
    textarea {
      height: unset;
    }
  }

  .seedError {
    margin-bottom: 1rem;
  }
`);
