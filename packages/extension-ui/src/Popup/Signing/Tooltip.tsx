// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<Props> = ({ children, className, content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>{children}</div>
      {showTooltip && (
        <>
          <div className='tooltip-content'>{content}</div>
          <div className='tooltip-arrow tooltip-arrow-bottom'></div>
        </>
      )}
    </div>
  );
};

export default styled(Tooltip)(
  ({ theme }: Props) => `
  position: relative;
  display: inline-block;
  text-transform: none;

  .tooltip-content {
    box-sizing: border-box;
    position: absolute;
    top: auto;
    bottom: 100%;
    left: 40%;
    transform: translate(-16%, -10%);
    background-color: #fff;
    color: ${theme.transactionTooltipTextColor};
    white-space: pre-line;
    z-index: 101;
    box-shadow: ${theme.tooltipBoxShadowTransaction};
    border-radius: 4px;
    padding: 16px;
    width: 165px;
    font-style: normal;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
  }

  .tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    z-index: 100;
  }

  .tooltip-arrow-bottom {
    border-width: 6px 6px 0 6px;
    border-color: #fff transparent transparent transparent;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
  }

`
);
