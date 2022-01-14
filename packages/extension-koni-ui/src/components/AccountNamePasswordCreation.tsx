// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import { Name, Password } from '../partials';
import { BackButton, ButtonArea, NextStepButton, VerticalSpace } from '.';

interface Props {
  buttonLabel?: string;
  isBusy: boolean;
  onBackClick?: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onNameChange: (name: string) => void;
  onPasswordChange?: (password: string) => void;
}

function AccountNamePasswordCreation ({ buttonLabel, isBusy, onBackClick, onCreate, onNameChange, onPasswordChange }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onCreate = useCallback(
    () => name && password && onCreate(name, password),
    [name, password, onCreate]
  );

  const _onNameChange = useCallback(
    (name: string | null) => {
      onNameChange(name || '');
      setName(name);
    },
    [onNameChange]
  );

  const _onPasswordChange = useCallback(
    (password: string | null) => {
      onPasswordChange && onPasswordChange(password || '');
      setPassword(password);
    },
    [onPasswordChange]
  );

  const _onBackClick = useCallback(
    () => {
      _onNameChange(null);
      setPassword(null);
      onBackClick && onBackClick();
    },
    [_onNameChange, onBackClick]
  );

  return (
    <>
      <Name
        isFocused
        onChange={_onNameChange}
      />
      <Password onChange={_onPasswordChange} />
      <VerticalSpace />
      {onBackClick && buttonLabel && (
        <ButtonArea>
          <BackButton onClick={_onBackClick} />
          <NextStepButton
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={!password || !name}
            onClick={_onCreate}
          >
            {buttonLabel}
          </NextStepButton>
        </ButtonArea>
      )}
    </>
  );
}

export default React.memo(AccountNamePasswordCreation);
