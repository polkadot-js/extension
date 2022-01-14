// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import styled, { css } from 'styled-components';

interface Props extends ThemeProps {
  withError?: boolean;
}

const TextInput = css(({ theme, withError }: Props) => `
  background: ${theme.inputBackground};
  border-radius: ${theme.borderRadius};
  border: 1px solid ${theme.inputBorderColor};
  border-color: ${withError ? theme.errorBorderColor : theme.inputBorderColor};
  box-sizing: border-box;
  color: ${withError ? theme.errorColor : theme.textColor};
  display: block;
  font-family: ${theme.fontFamily};
  font-size: ${theme.fontSize};
  height: 40px;
  outline: none;
  padding: 0.5rem 0.75rem;
  resize: none;
  width: 100%;

  &:read-only {
    background: ${theme.readonlyInputBackground};
    box-shadow: none;
    outline: none;
  }
`);

export const TextArea = styled.textarea<Props>`${TextInput}`;
export const Input = styled.input<Props>`${TextInput}`;
