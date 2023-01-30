// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
}

const AddButton: React.FC<Props> = function ({ className }: Props) {
  return (
    <Link to={'/account/create-menu'}>
      <div className={className}>
        <FontAwesomeIcon 
        className='icon' 
        icon={faPlus} />
      </div>
    </Link>
  );
};

export default styled(AddButton)(({ theme }: ThemeProps) => `
  position: absolute;
  bottom:16px;
  display: flex;
  left:0px;
  right:0px;
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
  transition: 0.4s ease-in-out;
  
  &:disabled {
    cursor: default;
    background: ${theme.addButtonBackground};
    opacity:0.3
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
  }
`
);
