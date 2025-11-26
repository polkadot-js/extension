// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft, faCog, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import logo from '../assets/pjs.svg';
import { ActionContext } from '../components/index.js';
import InputFilter from '../components/InputFilter.js';
import Link from '../components/Link.js';
import { useOutsideClick, useTranslation } from '../hooks/index.js';
import { getConnectedTabsUrl } from '../messaging.js';
import { styled } from '../styled.js';
import MenuAdd from './MenuAdd.js';
import MenuSettings from './MenuSettings.js';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onFilter?: (filter: string) => void;
  showAdd?: boolean;
  showBackArrow?: boolean;
  showConnectedAccounts?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  smallMargin?: boolean;
  text?: React.ReactNode;
}

function Header ({ children, className = '', onFilter, showAdd, showBackArrow, showConnectedAccounts, showSearch, showSettings, smallMargin = false, text }: Props): React.ReactElement<Props> {
  const [isAddOpen, setShowAdd] = useState(false);
  const [isSettingsOpen, setShowSettings] = useState(false);
  const [isSearchOpen, setShowSearch] = useState(false);
  const [filter, setFilter] = useState('');
  const [connectedTabsUrl, setConnectedTabsUrl] = useState<string[]>([]);
  const { t } = useTranslation();
  const addIconRef = useRef(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const setIconRef = useRef(null);
  const setMenuRef = useRef<HTMLDivElement>(null);
  const isConnected = useMemo(() => connectedTabsUrl.length >= 1
    , [connectedTabsUrl]);
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

  const _toggleAdd = useCallback(
    () => setShowAdd((isAddOpen) => !isAddOpen),
    []
  );

  const _toggleSettings = useCallback(
    () => setShowSettings((isSettingsOpen) => !isSettingsOpen),
    []
  );

  const _onChangeFilter = useCallback(
    (filter: string) => {
      setFilter(filter);
      onFilter && onFilter(filter);
    },
    [onFilter]
  );

  const _toggleSearch = useCallback(
    (): void => {
      if (isSearchOpen) {
        _onChangeFilter('');
      }

      setShowSearch((isSearchOpen) => !isSearchOpen);
    },
    [_onChangeFilter, isSearchOpen]
  );

  const _onBackArrowClick = useCallback(
    () => onAction('../index.js')
    , [onAction]);

  return (
    <div className={`${className} ${smallMargin ? 'smallMargin' : ''}`}>
      <div className='container'>
        <div className='branding'>
          {showBackArrow
            ? (
              <FontAwesomeIcon
                className='arrowLeftIcon'
                icon={faArrowLeft}
                onClick={_onBackArrowClick}
              />
            )
            : (
              <img
                className='logo'
                src={logo}
              />
            )
          }
          <span className='logoText'>{text || 'Polkadot Developer Signer'}</span>
        </div>
        {showSearch && (
          <div className={`searchBarWrapper ${isSearchOpen ? 'selected' : ''}`}>
            {showConnectedAccounts && !!isConnected && !isSearchOpen && (
              <div className='connectedAccountsWrapper'>
                <Link
                  className='connectedAccounts'
                  to={connectedTabsUrl.length === 1 ? `/url/manage/${encodeURIComponent(connectedTabsUrl[0])}` : '/auth-list'}
                >
                  <span className='greenDot'>•</span>Connect Accounts
                </Link>
              </div>
            )}
            {isSearchOpen && (
              <InputFilter
                className='inputFilter'
                onChange={_onChangeFilter}
                placeholder={t('Search by name or network...')}
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
              ref={addIconRef}
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
              ref={setIconRef}
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
          <MenuAdd reference={addMenuRef} />
        )}
        {isSettingsOpen && (
          <MenuSettings reference={setMenuRef} />
        )}
        {children}
      </div>
    </div>
  );
}

export default React.memo(styled(Header)<Props>`
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
    border-bottom: 1px solid var(--inputBorderColor);
    min-height: 70px;

    .branding {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--labelColor);
      font-family: var(--fontFamily);
      text-align: center;
      margin-left: 24px;

      .logo {
        height: 28px;
        width: 28px;
        margin: 8px 12px 12px 0;
      }

      .logoText {
        color: var(--textColor);
        font-family: var(--fontFamily);
        font-size: 20px;
        line-height: 27px;
      }
    }

    .popupMenus, .searchBarWrapper {
      align-self: center;
    }

    .connectedAccountsWrapper {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .connectedAccounts {
      border: 1px solid var(--inputBorderColor);
      border-radius: 4px;
      padding: 0 0.5rem;

      .greenDot {
        margin-right: 0.3rem;
        font-size: 1.5rem;
        color: var(--connectedDotColor);
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
    color: var(--iconNeutralColor);

    &.selected {
      color: var(--primaryColor);
    }
  }

  .arrowLeftIcon {
    color: var(--labelColor);
    margin-right: 1rem;
    cursor: pointer;
  }

  &.smallMargin {
    margin-bottom: 15px;
  }
`);
