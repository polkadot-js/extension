// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';
import Label from './Label';
import { Input } from './TextInputs';

interface Props extends ThemeProps {
  className?: string;
  defaultValue?: string | null;
  disabled?: boolean;
  isError?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  type?: 'text' | 'password';
  value?: string;
  withoutMargin?: boolean;
}

function InputWithLabel({
  className,
  defaultValue,
  disabled,
  isError,
  isFocused,
  isReadOnly,
  label = '',
  onBlur,
  onChange,
  onEnter,
  placeholder,
  type = 'text',
  value,
  withoutMargin
}: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
      onChange && onChange(value);
    },
    [onChange]
  );

  const [focused, setIsFocused] = React.useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur();
    }

    setIsFocused(false);
  }, [onBlur]);

  return (
    <Label
      active={focused || (value && value?.length > 0)}
      className={`${className || ''} ${withoutMargin ? 'withoutMargin' : ''}`}
      label={label}
    >
      <Input
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus={isFocused}
        defaultValue={defaultValue || undefined}
        disabled={disabled}
        onBlur={handleBlur}
        onChange={_onChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        readOnly={isReadOnly}
        spellCheck={false}
        type={type}
        value={value}
        withError={isError}
      />
    </Label>
  );
}

export default styled(InputWithLabel)(
  ({ label }: Props) => `
  margin-bottom: 16px;
 
  > ${Input} {
    padding-top: ${!label.trim() ? '0px' : '11px'};
 }

  &.withoutMargin {
    margin-bottom: 0px;

   + .danger {
      margin-top: 6px;
    }
  }
`
);
