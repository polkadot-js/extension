// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import upload from '../assets/file-upload.svg';
import { ActionContext, Address, ButtonArea, NextStepButton, TextAreaWithLabel, ValidatedInput, VerticalSpace, ActionText } from '../components';
import { createAccountSuri, validateSeed, jsonRestoreWindowOpen } from '../messaging';
import { Header, Name, Password } from '../partials';
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

export default function Import (): React.ReactElement {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onChangeSeed = useCallback(
    async (suri: string | null): Promise<void> => {
      if (suri) {
        setAccount(await validateSeed(suri));
      } else {
        setAccount(null);
      }
    },
    []
  );

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = useCallback((): void => {
    // this should always be the case
    if (name && password && account) {
      createAccountSuri(name, password, account.suri)
        .then(() => onAction('/'))
        .catch(console.error);
    }
  }, [account, name, onAction, password]);

  const _toJson = useCallback((): void => {
    // are we in a popup?
    if (window.innerWidth <= 480) {
      jsonRestoreWindowOpen().catch(console.error);
    } else {
      onAction('/account/restore-json');
    }
  }, [onAction]);

  return (
    <>
      <HeaderWithSmallerMargin
        showBackArrow
        text='Import account'
      />
      <ValidatedInput
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        component={SeedInput}
        isFocused
        label='existing 12 or 24-word mnemonic seed'
        onValidatedChange={_onChangeSeed}
        rowsCount={2}
        validator={isSeedValid}
      />
      {account && <Name onChange={setName} />}
      {account && name && <Password onChange={setPassword} />}
      {account && name && password && (
        <>
          <Address
            address={account.address}
            name={name}
          />
          <VerticalSpace />
          <ButtonArea>
            <NextStepButton
              onClick={_onCreate}
            >
              Add the account with the supplied seed
            </NextStepButton>
          </ButtonArea>
        </>
      )}
      {!account &&
        <ButtonsRow>
          <ActionText
            icon={upload}
            onClick={_toJson}
            text='Restore from JSON backup'
          />
        </ButtonsRow>
      }
    </>
  );
}

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;
`;

const SeedInput = styled(TextAreaWithLabel)`
  margin-bottom: 16px;
  textarea {
    height: unset;
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  flex-direction: row;

  ${ActionText} {
    margin-right: 32px;
  }
`;
