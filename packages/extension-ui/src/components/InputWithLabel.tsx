// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import viewOff from '../assets/viewOff.svg';
import viewOn from '../assets/viewOn.svg';
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
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  value?: string;
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
  onKeyDown,
  placeholder,
  type = 'text',
  value
}: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
      onChange && onChange(value);
    },
    [onChange]
  );

  const [focused, setIsFocused] = React.useState(false);
  const [isObscured, setIsObscured] = React.useState(true);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur();
    }

    setIsFocused(false);
  }, [onBlur]);

  const toggleObscure = useCallback(() => {
    setIsObscured((prevIsObscure) => !prevIsObscure);
  }, [setIsObscured]);

  return (
    <Label
      className={className}
      label={label}
      small={!!placeholder || focused || (!!value && value?.length > 0)}
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
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        readOnly={isReadOnly}
        spellCheck={false}
        type={isObscured ? type : 'text'}
        value={value}
        withError={isError}
      />
      {type === 'password' && (
        <IconButton
          onClick={toggleObscure}
          type='button'
        >
          <img src={isObscured ? viewOff : viewOn} />
        </IconButton>
      )}
    </Label>
  );
}

const IconButton = styled.button`
    all: unset;
    position: absolute;
    top: 18px;
    right: 20px;
    cursor: pointer;

    &:focus-visible {
      outline-style: auto;
    }
`;

export default styled(InputWithLabel)`
  > ${Input} {
    padding-top: ${({ label }) => (!label.trim() ? '0px' : '11px')};
 }
`;
