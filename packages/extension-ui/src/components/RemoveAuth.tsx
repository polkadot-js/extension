// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

function RemoveAuth (): React.ReactElement {
  return (
    <FontAwesomeIcon
      className='trashIcon'
      icon={faTrash}
    />
  );
}

export default styled(RemoveAuth)(({ theme }: ThemeProps) => `
  .trashIcon {
    cursor: pointer;
    color: ${theme.iconNeutralColor};
    margin-left: 8px;
    vertical-align: middle;

    &.selected {
      color: ${theme.primaryColor};
    }
  }

`);
