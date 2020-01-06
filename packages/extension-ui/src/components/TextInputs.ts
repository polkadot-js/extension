// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled, { css } from 'styled-components';

interface Props {
  withError?: boolean;
}

const DefaultTextInputColors = css`
  background: ${({ theme }): string => theme.inputBackground};
  border-color: ${({ theme }): string => theme.inputBorderColor};
  color: ${({ theme }): string => theme.textColor};
`;

const ErroredTextInputColors = css`
  background: ${({ theme }): string => theme.inputBackground};
  border-color: ${({ theme }): string => theme.errorBorderColor};
  color: ${({ theme }): string => theme.errorColor};
`;

const TextInput = css<Props>`
  border-radius: ${({ theme }): string => theme.borderRadius};
  border: ${({ theme }): string => `1px solid ${theme.inputBorderColor}`};
  outline: none;
  box-sizing: border-box;
  display: block;
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: ${({ theme }): string => theme.fontSize};
  font-weight: 600;
  height: 40px;
  padding: 0.5rem 0.75rem;
  resize: none;
  width: 100%;
  ${({ withError }): typeof ErroredTextInputColors => (withError ? ErroredTextInputColors : DefaultTextInputColors)};

  &:read-only {
    background: ${({ theme }): string => theme.readonlyInputBackground};
    box-shadow: none;
    outline: none;
  }
`;

export const TextArea = styled.textarea<Props>`${TextInput}`;
export const Input = styled.input<Props>`${TextInput}`;
