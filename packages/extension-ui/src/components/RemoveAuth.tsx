// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string
  onRemove: () => void
}

function RemoveAuth ({ className, onRemove }: Props): React.ReactElement {
  return (
    <FontAwesomeIcon
      className={className}
      icon={faTrash}
      onClick={onRemove}
      size='lg'
    />
  );
}

export default styled(RemoveAuth)<Props>`
  cursor: pointer;
  color: var(--labelColor);
  margin-right: 1rem;

  &.selected {
    color: var(--primaryColor);
  }
`;
