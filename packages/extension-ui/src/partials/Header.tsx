// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import logo from '../assets/azeroLogo.svg';
import helpIcon from '../assets/help.svg';
import settingsIcon from '../assets/settings.svg';
import { ActionContext, Link,Tooltip } from '../components';
import useOutsideClick from '../hooks/useOutsideClick';
import useTranslation from '../hooks/useTranslation';
import { getConnectedTabsUrl } from '../messaging';
// TODO: these will be reused in the future
// import MenuAdd from './MenuAdd';
// import MenuSettings from './MenuSettings';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  onFilter?: (filter: string) => void;
  showAdd?: boolean;
  showBackArrow?: boolean;
  showConnectedAccounts?: boolean;
  showHelp?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  smallMargin?: boolean;
  text?: React.ReactNode;
}

function Header({ children, className = '', onFilter, showAdd, showBackArrow, showConnectedAccounts, showHelp, showSearch, showSettings, smallMargin = false, text }: Props): React.ReactElement<Props> {
  const [isAddOpen, setShowAdd] = useState(false);
  const [isSettingsOpen, setShowSettings] = useState(false);
  const [isSearchOpen, setShowSearch] = useState(false);
  const [filter, setFilter] = useState('');
  const [connectedTabsUrl, setConnectedTabsUrl] = useState<string[]>([]);
  const { t } = useTranslation();
  const addIconRef = useRef(null);
  const addMenuRef = useRef(null);
  const setIconRef = useRef(null);
  const setMenuRef = useRef(null);
  const isConnected = useMemo(() => connectedTabsUrl.length >= 1, [connectedTabsUrl]);
  const onAction = useContext(ActionContext);

  useEffect(() => {
    if (!showConnectedAccounts) {
      return;
    }

    getConnectedTabsUrl()
      .then((tabsUrl) => setConnectedTabsUrl(tabsUrl))
      .catch(console.error);
  }, [showConnectedAccounts]);

  useOutsideClick([addIconRef, addMenuRef], (): void => {
    isAddOpen && setShowAdd(!isAddOpen);
  });

  useOutsideClick([setIconRef, setMenuRef], (): void => {
    isSettingsOpen && setShowSettings(!isSettingsOpen);
  });

  const _toggleAdd = useCallback(() => setShowAdd((isAddOpen) => !isAddOpen), []);

  const _toggleSettings = useCallback(() => setShowSettings((isSettingsOpen) => !isSettingsOpen), []);

  const _onChangeFilter = useCallback(
    (filter: string) => {
      setFilter(filter);
      onFilter && onFilter(filter);
    },
    [onFilter]
  );

  const _toggleSearch = useCallback((): void => {
    if (isSearchOpen) {
      _onChangeFilter('');
    }

    setShowSearch((isSearchOpen) => !isSearchOpen);
  }, [_onChangeFilter, isSearchOpen]);

  const _onBackArrowClick = useCallback(() => onAction('..'), [onAction]);

  return (
    <div className={`${className} ${smallMargin ? 'smallMargin' : ''}`}>
      <div className='container'>
        <div className='branding'>
          {showBackArrow ? (
            <FontAwesomeIcon
              className='arrowLeftIcon'
              icon={faArrowLeft}
              onClick={_onBackArrowClick}
            />
          ) : (
            <div className='flex'>
              <img
                className='logo'
                src={logo}
              />
            </div>
          )}
        </div>
        <div className='logoText-container'>
          <span className='logoText'>{text || 'polkadot{.js}'}</span>
        </div>
        <div className='popupMenus'>
          {showHelp && (
            <Tooltip text={t<string>('Help')}>
              <Link to={'/help'}>
              <img
                className='popupToggle'
                src={helpIcon}
              />
              </Link>
            </Tooltip>
          )}
          {showSettings && (
            <Tooltip text={t<string>('Settings')}>
              <Link to={'/account/settings'}>
              <img
                className='popupToggle'
                onClick={_toggleSettings}
                ref={setIconRef}
                src={settingsIcon}
              />
              </Link>
            </Tooltip>
          )}
        </div>
        {/* TODO: will be reused */}
        {/* {isAddOpen && <MenuAdd reference={addMenuRef} />} */}
        {/* {isSettingsOpen && <MenuSettings reference={setMenuRef} />} */}
        {children}
      </div>
    </div>
  );
}

export default React.memo(styled(Header)(({ theme }: ThemeProps) => `
  max-width: 100%;
  box-sizing: border-box;
  font-weight: normal;
  margin: 0;
  position: relative;
  margin-bottom: 25px;


  && {
    padding: 0 0 0;
  }

  .flex {
    display: flex;
  }

  > .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 56px;
    border-bottom: 1px solid ${theme.boxBorderColor};

    > div {
      flex: 1 0 0;
    }

    .branding {
      display: flex;
      align-items: center;
      color: ${theme.labelColor};
      font-family: ${theme.secondaryFontFamily};
      text-align: center;

      .logo {
        height: 24px;
        width: 24px;
        margin-left: 24px;
      }
    }

    .logoText-container {
      display:flex;
      align-items: center;
      justify-content: center;
      /* width: 100%; */

      .logoText {
        color: ${theme.textColor};
        font-family: ${theme.secondaryFontFamily};
        font-weight: 500;
        font-size: 14px;
        line-height: 120%;
        letter-spacing: 0.07em;

      }
    }

    .popupMenus {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    }

    .connectedAccountsWrapper {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .connectedAccounts {
      border: 1px solid ${theme.inputBorderColor};
      border-radius: 4px;
      padding: 0 0.5rem;

      .greenDot {
        margin-right: 0.3rem;
        font-size: 1.5rem;
        color: ${theme.connectedDotColor};
        padding-bottom: 0.2rem;
      }
    }

    .searchBarWrapper {
      flex: 1;
      display: flex;
      justify-content: end;
      align-items: center;

      .searchIcon {
        margin-right: 8px;

        &:hover {
          cursor: pointer;
        }
      }
    }

    .popupToggle {
      display: inline-block;
      vertical-align: middle;
      
      &:hover {
        cursor: pointer;
      }
    }

    .inputFilter {
      width: 100%
    }

    .popupToggle+.popupToggle {
      margin-left: 16px;
    }
  }

  .plusIcon, .cogIcon, .searchIcon {
    color: ${theme.iconNeutralColor};

    &.selected {
      color: ${theme.primaryColor};
    }
  }

  .arrowLeftIcon {
    color: ${theme.labelColor};
    margin-right: 1rem;
    margin-left: 24px;
    cursor: pointer;
  }

  &.smallMargin {
    margin-bottom: 15px;
  }
`
)
);
