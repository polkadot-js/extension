// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { styled } from '../styled.js';

interface Props {
  children: React.ReactNode;
  className?: string;
  isBelowInput?: boolean;
  isDanger?: boolean;
}

function Warning ({ children, className = '', isBelowInput, isDanger }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} ${isDanger ? 'danger' : ''} ${isBelowInput ? 'belowInput' : ''}`}>
      <FontAwesomeIcon
        className='warningImage'
        icon={faExclamationTriangle}
      />
      <div className='warning-message'>{children}</div>
    </div>
  );
}

export default React.memo(styled(Warning)<Props>(({ isDanger }) => `
  display: flex;
  flex-direction: row;
  padding-left: 18px;
  color: var(--subTextColor);
  margin-right: 20px;
  margin-top: 6px;
  border-left: 0.25rem solid var(--iconWarningColor);

  &.belowInput {
    font-size: var(--labelFontSize);
    line-height: var(--labelLineHeight);

    &.danger {
      margin-top: -10px;
    }
  }

  &.danger {
    border-left-color: var(--buttonBackgroundDanger);
  }

  .warning-message {
    display: flex;
    align-items: center;
  }

  .warningImage {
    margin: 5px 10px 5px 0;
    color: var(${isDanger ? '--iconDangerColor' : '--iconWarningColor'});
  }
`));
