// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import Label from '@polkadot/extension-koni-ui/components/Label';
import { Input } from '@polkadot/extension-koni-ui/components/TextInputs';
import Warning from '@polkadot/extension-koni-ui/components/Warning';

import useTranslation from '../hooks/useTranslation';

interface Props {
  className?: string;
  defaultValue?: string | null;
  disabled?: boolean;
  isError?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  label: string;
  onBlur?: (value: string) => void;
  onFocus?: (value: string) => void;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  value?: string;
  withoutMargin?: boolean;
}

function InputWithLabel ({ className, defaultValue, disabled, isError, isFocused, isReadOnly, label = '', onBlur, onChange, onEnter, onFocus, placeholder, type = 'text', value, withoutMargin }: Props): React.ReactElement<Props> {
  const [isCapsLock, setIsCapsLock] = useState(false);
  const { t } = useTranslation();

  const _checkKey = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      onEnter && event.key === 'Enter' && onEnter(event.target.value);

      if (type === 'password') {
        if (event.getModifierState('CapsLock')) {
          setIsCapsLock(true);
        } else {
          setIsCapsLock(false);
        }
      }
    },
    [onEnter, type]
  );

  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
      onChange && onChange(value);
    },
    [onChange]
  );

  const _onBlur = useCallback(
    ({ target: { value } }: React.FocusEvent<HTMLInputElement>): void => {
      onBlur && onBlur(value);
    },
    [onBlur]
  );

  const _onFocus = useCallback(
    ({ target: { value } }: React.FocusEvent<HTMLInputElement>): void => {
      onFocus && onFocus(value);
    },
    [onFocus]
  );

  return (
    <Label
      className={`${className || ''} ${withoutMargin ? 'withoutMargin' : ''}`}
      label={label}
    >
      <Input
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus={isFocused}
        defaultValue={defaultValue || undefined}
        disabled={disabled}
        onBlur={_onBlur}
        onChange={_onChange}
        onFocus={_onFocus}
        onKeyPress={_checkKey}
        placeholder={placeholder}
        readOnly={isReadOnly}
        spellCheck={false}
        type={type}
        value={value}
        withError={isError}
      />
      { isCapsLock && (
        <Warning isBelowInput>{t<string>('Warning: Caps lock is on')}</Warning>
      )}
    </Label>
  );
}

export default styled(InputWithLabel)`
  margin-top: 12px;

  &.withoutMargin {
    margin-bottom: 0px;

   + .danger {
      margin-top: 6px;
    }
  }
`;
