import styled, { css } from 'styled-components';

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

const TextInput = css<{ withError?: boolean }>`
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
  border-radius: ${({ theme }): string => theme.borderRadius};
  border-style: solid;
  border-width: 1px;
  box-sizing: border-box;
  display: block;
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: ${({ theme }): string => theme.fontSize};
  resize: none;
  width: 100%;
  ${({ withError }): typeof ErroredTextInputColors => (withError ? ErroredTextInputColors : DefaultTextInputColors)}
  
  &:read-only {
    background: ${({ theme }): string => theme.readonlyInputBackground}
    box-shadow: none;
    outline: none;
  }
`;

export const TextArea = styled.textarea`${TextInput}`;
export const Input = styled.input`${TextInput}`;
