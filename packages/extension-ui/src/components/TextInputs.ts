// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { css } from 'styled-components';

import { styled } from '../styled.js';

interface Props{
  withError?: boolean;
}

const TextInput = css(({ withError }: Props) => `
  background: var(--inputBackground);
  border-radius: var(--borderRadius);
  border: 1px solid var(--inputBorderColor);
  border-color: ${withError ? 'var(--errorBorderColor)' : 'var(--inputBorderColor)'};
  box-sizing: border-box;
  color: ${withError ? 'var(--errorColor)' : 'var(--textColor)'};
  display: block;
  font-family: var(--fontFamily);
  font-size: var(--fontSize);
  height: 40px;
  outline: none;
  padding: 0.5rem 0.75rem;
  resize: none;
  width: 100%;

  &:read-only {
    background: var(--readonlyInputBackground);
    box-shadow: none;
    outline: none;
  }
`);

export const TextArea = styled.textarea<Props>`${TextInput}`;
export const Input = styled.input<Props>`${TextInput}`;
