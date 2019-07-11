// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import Label from './Label';
import defaults from './defaults';

interface Props {
  className?: string;
  isError?: boolean;
  isFocussed?: boolean;
  isReadOnly?: boolean;
  label: string;
  onChange?: (value: string) => void;
  value?: string;
}

function TextArea ({ className, isFocussed, isReadOnly, label, onChange, value }: Props): React.ReactElement<Props> {
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
      />
    </Label>
  );
}

export default styled(TextArea)`
  textarea {
    background: ${({ isError, isReadOnly }) =>
      isError
        ? defaults.box.error.background
        : isReadOnly
          ? '#eee'
          : '#fff'
    };
    border-color: ${({ isError }) =>
      isError
        ? defaults.box.error.border
        : defaults.inputBorder
    };
    border-radius: ${defaults.borderRadius};
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: ${({ isError }) =>
      isError
        ? defaults.box.error.border
        : defaults.color
    };
    display: block;
    font-family: ${defaults.fontFamily};
    font-size: ${defaults.fontSize};
    padding: ${({ label }) =>
      label
        ? defaults.inputPaddingLabel
        : defaults.inputPadding
    };
    resize: none;
    width: 100%;

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }
`;
