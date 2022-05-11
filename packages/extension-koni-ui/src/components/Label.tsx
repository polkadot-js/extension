// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import warning from '@subwallet/extension-koni-ui/assets/warning.svg';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import React, { useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  label: string;
  showWarningIcon?: boolean;
  tooltipContent?: string;
}

let tooltipId = 0;

function Label ({ children, className, label, showWarningIcon = false, tooltipContent }: Props): React.ReactElement<Props> {
  const [trigger] = useState(() => `label-${++tooltipId}`);

  return (
    <div className={className}>
      <div className='label-wrapper'>
        <label>{label}</label>
        {showWarningIcon &&
        <img
          alt='warning'
          className='warning-image'
          data-for={trigger}
          data-tip={true}
          src={warning}
        />}

        {tooltipContent && (
          <Tooltip
            offset={{ bottom: 8 }}
            place={'bottom'}
            text={tooltipContent}
            trigger={trigger}
          />
        )}
      </div>

      {children}
    </div>
  );
}

export default styled(Label)(({ theme }: ThemeProps) => `
  color: ${theme.textColor2};

  .label-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  label {
    font-size: 12px;
    line-height: 24px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 400;
  }

  .warning-image {
    min-height: 18px;
    height: 18px;
    padding-left: 5px;
  }
`);
