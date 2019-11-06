// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import Label from './Label';

interface Props {
  className?: string;
  isError?: boolean;
  isFocussed?: boolean;
  isReadOnly?: boolean;
  rowsCount?: number;
  label: string;
  onChange?: (value: string) => void;
  value?: string;
}

function TextArea ({ className, isFocussed, isReadOnly, label, onChange, value, rowsCount }: Props): React.ReactElement<Props> {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onChange && onChange(value.trim());
  };

  return (
    <Label
      className={className}
      label={label}
    >
      <textarea
        autoFocus={isFocussed}
        onChange={_onChange}
        readOnly={isReadOnly}
        value={value}
        rows={rowsCount || 2}
      />
    </Label>
  );
}

export default styled(TextArea)`
  textarea {
    background: ${({ isError, isReadOnly, theme }): string => isError ? theme.box.error.background : (isReadOnly ? '#eee' : '#fff')};
    border-color: ${({ isError, theme }): string => isError ? theme.box.error.border : theme.inputBorder};
    border-radius: ${({ theme }): string => theme.borderRadius};
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: ${({ isError, theme }): string => isError ? theme.box.error.border : theme.color};
    display: block;
    font-family: ${({ theme }): string => theme.fontFamily};
    font-size: ${({ theme }): string => theme.fontSize};
    padding: ${({ label, theme }): string => label ? theme.inputPaddingLabel : theme.inputPadding};
    resize: none;
    width: 100%;

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }
`;
