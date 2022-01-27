// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import styled from 'styled-components';

import Tooltip from '@polkadot/extension-koni-ui/components/Tooltip';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

let tooltipId = 0;

interface Props extends ThemeProps {
  className?: string;
  onClick?: () => void;
  tooltipContent?: string;
  iconSrc: string;
}

function HomeActionButton ({ className, iconSrc, onClick, tooltipContent }: Props): React.ReactElement {
  const [trigger] = useState(() => `home-action-button-${++tooltipId}`);

  return (
    <>
      <div
        className={`home-action-button action-button ${className || ''}`}
        data-for={trigger}
        data-tip={true}
        onClick={onClick}
      >
        <img
          alt='Icon'
          src={iconSrc}
        />
      </div>

      {tooltipContent && (
        <Tooltip
          text={tooltipContent}
          trigger={trigger}
        />
      )}
    </>
  );
}

export default styled(HomeActionButton)(({ theme }: Props) => `
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 40%;
    background-color: ${theme.buttonBackground};
    cursor: pointer;

    img {
      width: 24px;
      height: 24px;
    }
`);
