import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import add from '../assets/add.svg';
import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
}

const StyledLink = styled(Link)<{ isExpanded: boolean }>`
  text-decoration: none;
  border-radius: ${({ isExpanded }) => (isExpanded ? '24px' : '50%')};

  &:focus {
    outline: 1px solid ${({ theme }: ThemeProps) => theme.addButtonFocusBorder};
  }

  &:active {
    .container {
      margin-top: 2px;
    }
  }
`;

const AddButton: React.FC<Props> = function ({ className }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = useCallback((): void => {
    setIsExpanded(true);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsExpanded(false);
  }, []);

  return (
    <StyledLink
      className={className}
      isExpanded={isExpanded}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      to={'/account/add-menu'}
    >
      <div className={className}>
        <div className='container'>
          <img
            className='icon'
            src={add}
          />
          {isExpanded && <span className='expanded'>Add Account</span>}
        </div>
      </div>
    </StyledLink>
  );
};

export default styled(AddButton)(
  ({ theme }: ThemeProps) => `
  
  display: flex;
  margin-left:auto;
  margin-right:auto;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  background:${theme.addButtonBackground};
  border-radius: 50%;
  padding:0px;
  transition: 0.2s ease;

  .container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  
  &:disabled {
    cursor: default;
    background: ${theme.addButtonBackground};
    opacity: 0.3
  }

  &:not(:disabled):hover, &:active {
    background: ${theme.addButtonHoverBackground};
    box-shadow: ${theme.addButtonHoverBoxShadow};
  }

  & svg path {
  fill: ${theme.primaryColor}
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  &:hover {
    cursor: pointer;
    width: 100%;
    width: 328px;
    border-radius: 24px;
  }

  span {
    display: inline-block;
    margin-left: 8px;
    opacity: 0;
    transition: 0.2s ease 1s;
    color: ${theme.primaryColor};
    text-decoration: none;
  }

  .expanded {
    animation: fadeIn 0.2s ease 0.1s forwards;
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`
);
