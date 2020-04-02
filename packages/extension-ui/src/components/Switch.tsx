import React from 'react';
import styled from 'styled-components';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  uncheckedLabel: string;
  checkedLabel: string;
  className?: string;
}

function Switch ({ checked, checkedLabel, className, onChange, uncheckedLabel }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <span>{uncheckedLabel}</span>
      <label>
        <Checkbox
          checked={checked}
          onChange={((event): void => onChange(event.target.checked))}
        />
        <Slider />
      </label>
      <span>{checkedLabel}</span>
    </div>
  );
}

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }): string => theme.readonlyInputBackground};
  transition: 0.2s;
  border-radius: 100px;
  border: 1px solid ${({ theme }): string => theme.inputBorderColor};

  &:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 3px;
    background-color: ${({ theme }): string => theme.primaryColor};
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Checkbox = styled.input.attrs(() => ({
  type: 'checkbox'
}))`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + ${Slider}:before {
    transform: translateX(24px);
  }
`;

export default styled(Switch)`
  label {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
    margin: 8px;
  }

  span {
    font-weight: 600;
  }
`;
