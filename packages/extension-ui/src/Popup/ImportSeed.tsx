// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AccountContext, ActionContext, Address, ButtonArea, Checkbox, NextStepButton, TextAreaWithLabel, ValidatedInput } from '../components';
import useTranslation from '../hooks/useTranslation';
import { createAccountSuri, validateSeed } from '../messaging';
import { Header, Name, Password } from '../partials';
import { DEFAULT_TYPE } from '../util/defaultType';
import { allOf, isNotShorterThan, Result } from '../util/validators';

async function validate (suri: string): Promise<Result<string>> {
  try {
    await validateSeed(suri);

    return Result.ok(suri);
  } catch (error) {
    return Result.error((error as Error).message);
  }
}

const isSeedValid = allOf(
  isNotShorterThan(1, 'Seed is empty'),
  validate
);

const SeedInput = styled(TextAreaWithLabel)`
  margin-bottom: 16px;
  textarea {
    height: unset;
  }
`;

function Import ({ className } : {className?: string}): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isEthereum, setIsEthereum] = useState(false);
  const type = useMemo(() =>
    isEthereum
      ? 'ethereum'
      : DEFAULT_TYPE,
  [isEthereum]);

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onChangeSeed = useCallback(
    async (suri: string | null): Promise<void> => {
      if (suri) {
        try {
          return setAccount(await validateSeed(suri, type));
        } catch (error) {
          console.error(error);
        }
      }

      setAccount(null);
    },
    [type]
  );

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = useCallback((): void => {
    // this should always be the case
    if (name && password && account) {
      setIsBusy(true);

      createAccountSuri(name, password, account.suri, type)
        .then(() => onAction('/'))
        .catch((error): void => {
          setIsBusy(false);
          console.error(error);
        });
    }
  }, [account, name, onAction, password, type]);

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Import account')}
      />
      <div className={className}>
        <div>
          <Address
            address={account?.address}
            name={name}
            type={type}
          />
        </div>
        <ValidatedInput
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
          component={SeedInput}
          isFocused
          label={t<string>('existing 12 or 24-word mnemonic seed')}
          onValidatedChange={_onChangeSeed}
          rowsCount={2}
          validator={isSeedValid}
        />
        <Checkbox
          checked={isEthereum}
          className='checkbox'
          label={t<string>('Ethereum account')}
          onChange={setIsEthereum}
        />
        {account && (
          <>
            <Name onChange={setName} />
            <Password onChange={setPassword} />
          </>
        )}
      </div>
      {account && name && password && (
        <ButtonArea>
          <NextStepButton
            isBusy={isBusy}
            onClick={_onCreate}
          >
            {t<string>('Add the account with the supplied seed')}
          </NextStepButton>
        </ButtonArea>
      )}
    </>
  );
}

export default styled(Import)`
  height: 100%;
  overflow-y: auto;

  .checkbox {
    margin : 0;
  }
`;
