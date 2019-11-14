import styled, { css } from 'styled-components';

interface Props {
  withError?: boolean;
}

const DefaultTextInputColors = css`
  background: ${({ theme }): string => theme.inputBackground};
  border-color: ${({ theme }): string => theme.inputBorder};
  color: ${({ theme }): string => theme.color};
`;

const ErroredTextInputColors = css`
  background: ${({ theme }): string => theme.box.error.background};
  border-color: ${({ theme }): string => theme.box.error.border};
  color: ${({ theme }): string => theme.box.error.border};
`;

const TextInput = css<Props>`
  border-radius: ${({ theme }): string => theme.borderRadius};
  border: ${({ theme }): string => `1px solid ${theme.inputBorder}`};
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  display: block;
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: ${({ theme }): string => theme.fontSize};
  font-weight: 600;
  height: ${({ theme }): string => theme.inputHeight};
  padding: ${({ theme }): string => theme.inputPadding};
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
