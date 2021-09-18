// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowLeft, faCog, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import logo from '../assets/pjs.svg';
import InputFilter from '../components/InputFilter';
import Link from '../components/Link';
import useOutsideClick from '../hooks/useOutsideClick';
import useTranslation from '../hooks/useTranslation';
import MenuAdd from './MenuAdd';
import MenuSettings from './MenuSettings';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  onFilter?: (filter: string) => void;
  showAdd?: boolean;
  showBackArrow?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  smallMargin?: boolean;
  text?: React.ReactNode;
}

function Header ({ children, className = '', onFilter, showAdd, showBackArrow, showSearch, showSettings, smallMargin = false, text }: Props): React.ReactElement<Props> {
  const [isAddOpen, setShowAdd] = useState(false);
  const [isSettingsOpen, setShowSettings] = useState(false);
  const [isSearchOpen, setShowSearch] = useState(false);
  const [filter, setFilter] = useState('');
  const { t } = useTranslation();
  const addRef = useRef(null);
  const setRef = useRef(null);

  useOutsideClick(addRef, (): void => {
    isAddOpen && setShowAdd(!isAddOpen);
  });

  useOutsideClick(setRef, (): void => {
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

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
    onFilter && onFilter(filter);
  }, [onFilter]);

  const _toggleSearch = useCallback(
    (): void => {
      if (isSearchOpen) {
        _onChangeFilter('');
      }

      setShowSearch((isSearchOpen) => !isSearchOpen);
    },
    [_onChangeFilter, isSearchOpen]
  );

  return (
    <div className={`${className} ${smallMargin ? 'smallMargin' : ''}`}>
      <div className='container'>
        <div className='branding'>
          {showBackArrow
            ? (
              <Link
                className='backlink'
                to='/'
              >
                <FontAwesomeIcon
                  className='arrowLeftIcon'
                  icon={faArrowLeft}
                />
              </Link>
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
        {showSearch && (
          <div className={`searchBarWrapper ${isSearchOpen ? 'selected' : ''}`}>
            {isSearchOpen && (
              <InputFilter
                className='inputFilter'
                onChange={_onChangeFilter}
                placeholder={t<string>('Search by name or network...')}
                value={filter}
                withReset
              />
            )}
            <FontAwesomeIcon
              className={`searchIcon ${isSearchOpen ? 'selected' : ''}`}
              icon={faSearch}
              onClick={_toggleSearch}
              size='lg'
            />
          </div>
        )}
        <div className='popupMenus'>
          {showAdd && (
            <div
              className='popupToggle'
              onClick={_toggleAdd}
            >
              <FontAwesomeIcon
                className={`plusIcon ${isAddOpen ? 'selected' : ''}`}
                icon={faPlusCircle}
                size='lg'
              />
            </div>
          )}
          {showSettings && (
            <div
              className='popupToggle'
              data-toggle-settings
              onClick={_toggleSettings}
            >
              <FontAwesomeIcon
                className={`cogIcon ${isSettingsOpen ? 'selected' : ''}`}
                icon={faCog}
                size='lg'
              />
            </div>
          )}
        </div>
        {isAddOpen && (
          <MenuAdd reference={addRef} />
        )}
        {isSettingsOpen && (
          <MenuSettings reference={setRef} />
        )}
        {children}
      </div>
    </div>
  );
}

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

    .popupMenus, .searchBarWrapper {
      align-self: center;     
    }

    .searchBarWrapper {
      flex: 1;
      display: flex;
      justify-content: end;
      align-items: center;;

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
  
      &:last-child {
        margin-right: 24px;
      }
   
      &:hover {
        cursor: pointer;
      }
    }

    .inputFilter {
      width: 100%
    }
  
    .popupToggle+.popupToggle {
      margin-left: 8px;
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
  }

  .backlink {
    color: ${theme.labelColor};
    min-height: 52px;
    text-decoration: underline;
    width: min-content;

    &:visited {
      color: ${theme.labelColor};
    }
  }

  &.smallMargin {
    margin-bottom: 15px;
  }
`));
