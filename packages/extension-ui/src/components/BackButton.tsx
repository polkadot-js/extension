// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { styled } from '../styled.js';
import Button from './Button.js';

interface Props {
  className?: string;
  onClick: () => void;
}

function BackButton ({ className, onClick }: Props): React.ReactElement<Props> {
  return (
    <Button
      className={className}
      onClick={onClick}
    >
      <FontAwesomeIcon
        className='arrowLeft'
        icon={faArrowLeft}
        size='sm'
      />
    </Button>
  );
}

export default styled(BackButton)<Props>`
  background: var(--backButtonBackground);
  margin-right: 11px;
  width: 42px;

  .arrowLeft {
    color: var(--backButtonTextColor);
    display: block;
    margin: auto;
  }

  &:not(:disabled):hover {
    background: var(--backButtonBackgroundHover);
  }
`;
