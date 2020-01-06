// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';

import Label from './Label';
import { TextArea } from './TextInputs';

interface Props {
  className?: string;
  isError?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  rowsCount?: number;
  label: string;
  onChange?: (value: string) => void;
  value?: string;
}

export default function TextAreaWithLabel ({ className, isFocused, isReadOnly, label, onChange, value, rowsCount, isError }: Props): React.ReactElement<Props> {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onChange && onChange(value.trim());
  };

  return (
    <Label
      className={className}
      label={label}
    >
      <TextArea
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus={isFocused}
        onChange={_onChange}
        readOnly={isReadOnly}
        rows={rowsCount || 2}
        spellCheck={false}
        value={value}
        withError={isError}
      />
    </Label>
  );
}
