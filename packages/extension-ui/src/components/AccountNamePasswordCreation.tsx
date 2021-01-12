// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import { Name, Password } from '../partials';
import { BackButton, ButtonArea, NextStepButton, VerticalSpace } from '.';

interface Props {
  buttonLabel: string;
  isBusy: boolean;
  onBackClick: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onNameChange: (name: string) => void;
}

function AccountNamePasswordCreation ({ buttonLabel, isBusy, onBackClick, onCreate, onNameChange }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onCreate = useCallback(
    () => name && password && onCreate(name, password),
    [name, password, onCreate]
  );

  const _onNameChange = useCallback((name: string | null) => {
    onNameChange(name || '');
    setName(name);
  }, [onNameChange]);

  return (
    <>
      <Name
        isFocused
        onChange={_onNameChange}
      />
      <Password onChange={setPassword} />
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onBackClick} />
        <NextStepButton
          data-button-action='add new root'
          isBusy={isBusy}
          isDisabled={!password || !name}
          onClick={_onCreate}
        >
          {buttonLabel}
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default React.memo(AccountNamePasswordCreation);
