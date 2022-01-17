// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import styled, { css } from 'styled-components';

interface Props extends ThemeProps {
  withError?: boolean;
}

const TextInput = css(({ theme, withError }: Props) => `
  background: ${theme.backgroundAccountAddress};
  border-radius: 8px;
  border: none;
  box-sizing: border-box;
  color: ${withError ? theme.errorColor : theme.textColor2};
  display: block;
  font-family: ${theme.fontFamily};
  font-size: ${theme.fontSize2};
  height: 48px;
  outline: none;
  padding: 0.5rem 0.75rem;
  resize: none;
  width: 100%;
  margin-top: 4px;

  &:read-only {
    background: ${theme.readonlyInputBackground};
    box-shadow: none;
    outline: none;
  }
`);

export const TextArea = styled.textarea<Props>`${TextInput}`;
export const Input = styled.input<Props>`${TextInput}`;
