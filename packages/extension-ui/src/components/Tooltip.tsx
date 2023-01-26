// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-no-bind */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props {
  children: React.ReactNode;
  text: string;
}

const TOOLTIP_MARGIN = 14;

const Tooltip: React.FC<Props> = function ({ children, text }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  function _checkBoundaries() {
    const tooltip = tooltipRef.current;

    if (!tooltip) {
      return;
    }

    const tooltipRect = tooltip.getBoundingClientRect();

    if (tooltipRect.left < 0) {
      tooltip.style.left = `${tooltipRect.width / 2 - TOOLTIP_MARGIN}px`;
    }

    if (tooltipRect.right > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.right - TOOLTIP_MARGIN}px`;
    }
  }

  function _handleMouseEnter() {
    setIsVisible(true);
    _checkBoundaries();
  }

  function _handleMouseLeave() {
    setIsVisible(false);
  }

  useEffect(() => {
    if (isVisible) {
      _checkBoundaries();
    }
  }, [isVisible]);

  return (
    <StyledTooltipContainer 
    onMouseEnter={_handleMouseEnter} 
    onMouseLeave={_handleMouseLeave}>
      {children}
      {isVisible && (
        <StyledTooltip 
        className='tooltip' 
        ref={tooltipRef}>
          <span>{text}</span>
        </StyledTooltip>
      )}
    </StyledTooltipContainer>
  );
};

export default Tooltip;

const StyledTooltip = styled.div`
    display: flex;
    flex-direction: row;
    align-items: baseline;
    white-space: nowrap;
    padding: 4px 8px;
    gap: 8px;
    position: absolute;
    transform: translateX(-50%);
    bottom: -32px;
    background-color: ${({ theme }: ThemeProps) => theme.tooltipBackground};
    color: ${({ theme }: ThemeProps) => theme.tooltipTextColor};
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid ${({ theme }: ThemeProps) => theme.tooltipBorderColor};
    box-shadow: ${({ theme }: ThemeProps) => theme.tooltipBoxShadow};
    border-radius: 2px;
    margin-top:14px;

    & span  {
    font-family: ${({ theme }: ThemeProps) => theme.primaryFontFamily};
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    }

`;

const StyledTooltipContainer = styled.div`
    display: inline-block;
    position: relative;
    height: 25px;
    z-index: 99;
`;
