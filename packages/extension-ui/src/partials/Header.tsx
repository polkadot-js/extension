// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import ArrowLeftImage from '../assets/arrowLeft.svg';
import gear from '../assets/gear.svg';
import plus from '../assets/plus.svg';
import logo from '../assets/pjs.svg';
import { Link, Svg } from '../components';
import useOutsideClick from '../hooks/useOutsideClick';
import MenuAdd from './MenuAdd';
import MenuSettings from './MenuSettings';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  showAdd?: boolean;
  showBackArrow?: boolean;
  showSettings?: boolean;
  text?: React.ReactNode;
}

interface MenuSelectProps {
  isSelected: boolean;
}

function Header ({ children, className, showAdd, showBackArrow, showSettings, text }: Props): React.ReactElement<Props> {
  const [isAddOpen, setShowAdd] = useState(false);
  const [isSettingsOpen, setShowSettings] = useState(false);
  const actionsRef = useRef(null);

  useOutsideClick(actionsRef, (): void => {
    isAddOpen && setShowAdd(!isAddOpen);
    isSettingsOpen && setShowSettings(!isSettingsOpen);
  });

  const _toggleAdd = useCallback(
    (): void => setShowAdd((isAddOpen) => !isAddOpen),
    []
  );

  const _toggleSettings = useCallback(
    (): void => setShowSettings((isSettingsOpen) => !isSettingsOpen),
    []
  );

  return (
    <div className={className}>
      <div className='container'>
        <div className='branding'>
          {showBackArrow
            ? (
              <BackLink to='/'>
                <ArrowLeft/>
              </BackLink>
            )
            : (
              <img
                className='logo'
                src={logo}
              />
            )
          }
          <span className='logoText'>{text || 'polkadot{.js}'}</span>
        </div>
        <div className='popupMenus'>
          {showAdd && (
            <div
              className='popupToggle'
              onClick={_toggleAdd}
            >
              <Plus isSelected={isAddOpen} />
            </div>
          )}
          {showSettings && (
            <div
              className='popupToggle'
              onClick={_toggleSettings}
            >
              <Gear isSelected={isSettingsOpen} />
            </div>
          )}
        </div>
        {isAddOpen && (
          <MenuAdd reference={actionsRef}/>
        )}
        {isSettingsOpen && (
          <MenuSettings reference={actionsRef}/>
        )}
        {children}
      </div>
    </div>
  );
}

const BackLink = styled(Link)`
  color: ${({ theme }: ThemeProps) => theme.labelColor};
  min-height: 52px;
  text-decoration: underline;
  width: min-content;

  &:visited {
    color: ${({ theme }: ThemeProps) => theme.labelColor};
  }
`;

const ArrowLeft = styled(Svg).attrs(() => ({ src: ArrowLeftImage }))`
  background: ${({ theme }: ThemeProps) => theme.labelColor};
  width: 12px;
  height: 12px;
  margin-right: 13px;
`;

const Gear = styled(Svg).attrs(() => ({ src: gear }))<MenuSelectProps>`
  background: ${({ isSelected, theme }: ThemeProps & MenuSelectProps): string => isSelected ? theme.primaryColor : theme.iconNeutralColor};
  height: 22px;
  width: 22px;
`;

Gear.displayName = 'Gear';

const Plus = styled(Svg).attrs(() => ({ src: plus }))<MenuSelectProps>`
  background: ${({ isSelected, theme }: ThemeProps & MenuSelectProps): string => isSelected ? theme.primaryColor : theme.iconNeutralColor};
  height: 22px;
  width: 22px;
`;

export default React.memo(styled(Header)(({ theme }: Props) => `
  max-width: 100%;
  box-sizing: border-box;
  font-weight: normal;
  margin: 0;
  position: relative;
  margin-bottom: 25px;

  && {
    padding: 0 0 0;
  }

  > .container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid ${theme.inputBorderColor};
    min-height: 70px;

    .branding {
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${theme.labelColor};
      font-family: ${theme.fontFamily};
      text-align: center;
      margin-left: 24px;

      .logo {
        height: 28px;
        width: 28px;
        margin: 8px 12px 12px 0;
      }

      .logoText {
        color: ${theme.textColor};
        font-family: ${theme.fontFamily};
        font-size: 20px;
        line-height: 27px;
      }
    }

    .popupMenus {
      align-self: center;

      .popupToggle {
        display: inline-block;
        vertical-align: middle;

        &:last-child {
          margin-right: 24px;
        }

        &:hover {
          cursor: pointer;
        }
      }

      .popupToggle+.popupToggle {
        margin-left: 8px;
      }
    }
  }
`));
