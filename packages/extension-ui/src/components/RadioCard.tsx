import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Option {
  text: string;
  value: string;
}

interface Props extends ThemeProps {
  className?: string;
  option: Option;
  selectedValue: string;
  onChange: (value: string) => void;
}

function RadioCard({ className, onChange, option, selectedValue }: Props): React.ReactElement<Props> {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      onChange(value);
    },
    [onChange]
  );

  const handleClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
      handleChange({
        target: inputRef.current
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [inputRef, handleChange]);

  return (
    <div className={className}>
      <Label
        htmlFor={option.text}
        isOutlined={isFocusVisible}
        onClick={handleClick}
      >
        <span>{option.text}</span>
        <input
          checked={selectedValue === option.value}
          id={option.text}
          onBlur={() => setIsFocusVisible(false)}
          onChange={handleChange}
          onFocus={() => {
            const isFocusVisible = !!inputRef.current?.matches(':focus-visible');

            setIsFocusVisible(isFocusVisible);
          }}
          ref={inputRef}
          type='radio'
          value={option.value}
        />
      </Label>
    </div>
  );
}

const Label = styled.label<{ isOutlined: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    width: 100%;
    padding: 16px;

    :has(input:focus-visible) {
      outline-style: auto;
    }

    /* :has selector is the pure css solution to this problem, but doesn't have (so far) enough support ;( */
    ${({ isOutlined }) => (isOutlined ? 'outline-style: auto;' : '')}
`;

export default styled(RadioCard)(
  ({ theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme.menuBackground};
  height: 48px;
  margin-bottom: 2px;
  margin-top: 0px;
  border-radius: 2px;
  transition: 0.2s ease;
  font-family: ${theme.secondaryFontFamily};
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: 0.07em;

  &:hover, &:focus {
    background: ${theme.editCardBackgroundHover};

    input {
      outline: 1px solid ${theme.primaryColor};
    }
  }

  span {
    flex: 1;
  }

  input {
    appearance: none;
    -webkit-appearance: none;
    border-radius: 50%;
    background: ${theme.inputBackground};
    border: 3px solid ${theme.inputBackground};
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: 0.2s ease;
    outline: 1px solid ${theme.inputRadioBorderColor};

    &:checked {
      background-color: ${theme.primaryColor};
    }

  }
`
);
