// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';

import Label from './Label';
import styled from 'styled-components';
import { Input } from './TextInputs';

interface Props {
  className?: string;
  defaultValue?: string | null;
  isError?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  type?: 'text' | 'password';
  value?: string;
}

function InputWithLabel ({ className, defaultValue, label, isFocused, isReadOnly, onBlur, onChange, type = 'text', value, isError }: Props): React.ReactElement<Props> {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
    onChange && onChange(value.trim());
  };

  return (
    <Label
      className={className}
      label={label}
    >
      <Input
        withError={isError}
        autoFocus={isFocused}
        defaultValue={defaultValue || undefined}
        readOnly={isReadOnly}
        onBlur={onBlur}
        onChange={_onChange}
        type={type}
        value={value}
      />
    </Label>
  );
}

export default styled(InputWithLabel)`
  margin-bottom: 16px;
`;
