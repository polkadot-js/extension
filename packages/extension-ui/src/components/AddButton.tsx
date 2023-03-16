// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
}

const StyledLink = styled(Link)`
  text-decoration: none;
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      to={'/account/add-menu'}
    >
      <div className={className}>
        <FontAwesomeIcon
          className='icon'
          icon={faPlus}
        />
        {isExpanded && <span className='expanded'>Add Account</span>}
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
  
  &:disabled {
    cursor: default;
    background: ${theme.addButtonBackground};
    opacity: 0.3
  }

  &:focus{
    outline: none;
    border: ${theme.addButtonFocusBorder};
  }

  &:not(:disabled):hover, &:active {
    background: ${theme.addButtonHoverBackground};
    box-shadow: ${theme.addButtonHoverBoxShadow};
  }

  & svg path {
  fill: ${theme.primaryColor}
  }

  .icon {
    width: 15px;
    height: 15px;
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
