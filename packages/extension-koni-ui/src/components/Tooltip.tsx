// Copyright 2017-2022 @polkadot/ authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ReactTooltip from 'react-tooltip';
import styled, { ThemeContext } from 'styled-components';

import { Theme } from '@polkadot/extension-koni-ui/components';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

function rootElement () {
  return typeof document === 'undefined'
    ? null // This hack is required for server side rendering
    : document.getElementById('tooltips');
}

interface Props extends ThemeProps {
  className?: string;
  clickable?: boolean;
  dataFor?: string;
  effect?: 'solid' | 'float';
  offset?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  place?: 'bottom' | 'top' | 'right' | 'left';
  text: React.ReactNode;
  trigger: string;
}

function Tooltip ({ className = '', clickable = false, effect = 'solid', offset, place = 'top', text, trigger }: Props): React.ReactElement<Props> | null {
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const theme = themeContext.id;
  const [tooltipContainer] = useState(
    typeof document === 'undefined'
      ? {} as HTMLElement // This hack is required for server side rendering
      : document.createElement('div')
  );

  useEffect((): () => void => {
    const root = rootElement();

    root && root.appendChild(tooltipContainer);

    return (): void => {
      root && root.removeChild(tooltipContainer);
    };
  }, [tooltipContainer]);

  return ReactDOM.createPortal(
    <ReactTooltip
      backgroundColor={theme === 'dark' ? '#181E42' : ''}
      className={`ui--Tooltip ${className}`}
      clickable={clickable}
      effect={effect}
      id={trigger}
      offset={offset}
      place={place}
      textColor={theme === 'dark' ? '#FFF' : ''}
    >
      {className?.includes('address') ? <div>{text}</div> : text}
    </ReactTooltip>,
    tooltipContainer
  );
}

export default React.memo(styled(Tooltip)(({ theme }: Props) => `
  > div {
    overflow: hidden;
  }

  &.ui--Tooltip {
    z-index: 1100;
    max-width: 300px;
    text-align: center;
    border: 1px solid #2D365C;
    box-shadow: 0px 10px 40px rgba(0, 75, 255, 0.4);
    border-radius: 5px;
  }

  &.__react_component_tooltip.place-top:before {
    border-top: 8px solid #2D365C;
  }

  &.__react_component_tooltip.place-right:before {
    border-right: 8px solid #2D365C;
  }

  table {
    border: 0;
    overflow: hidden;
    width: 100%;

    td {
      text-align: left;
    }

    td:first-child {
      opacity: 0.75;
      padding-right: 0.25rem;
      text-align: right;
      white-space: nowrap;
    }
  }

  div+table,
  table+div {
    margin-top: 0.75rem;
  }

  > div+div {
    margin-top: 0.5rem;
  }

  &.address div {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .faded {
    margin-top: 0;
    opacity: 0.75 !important;
    font-size: 0.85em !important;

    .faded {
      font-size: 1em !important;
    }
  }

  .faded+.faded {
    margin-top: 0;
  }

  .row+.row {
    margin-top: 0.5rem;
  }
`));
