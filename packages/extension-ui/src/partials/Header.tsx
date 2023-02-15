// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import logo from '../assets/azeroLogo.svg';
import helpIcon from '../assets/help.svg';
import settingsIcon from '../assets/settings.svg';
import { ActionContext, Link, Svg, Tooltip } from '../components';
import useTranslation from '../hooks/useTranslation';
// import { getConnectedTabsUrl } from '../messaging';
// TODO: these will be reused in the future
// import MenuAdd from './MenuAdd';
// import MenuSettings from './MenuSettings';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  onFilter?: (filter: string) => void;
  withBackArrow?: boolean;
  showConnectedAccounts?: boolean;
  withHelp?: boolean;
  withSettings?: boolean;
  smallMargin?: boolean;
  text?: React.ReactNode;
  withStepper?: boolean;
  withGoToRoot?: boolean;
}

function Header({
  children,
  className = '',

  smallMargin = false,
  text,
  withBackArrow,
  withGoToRoot = false,
  withHelp,
  withSettings
}: Props): React.ReactElement<Props> {
  // TODO: check if needed
  // const [connectedTabsUrl, setConnectedTabsUrl] = useState<string[]>([]);
  const { t } = useTranslation();

  // TODO: check if needed
  // const isConnected = useMemo(() => connectedTabsUrl.length >= 1, [connectedTabsUrl]);
  const onAction = useContext(ActionContext);

  // TODO: check if needed
  // useEffect(() => {
  //   if (!showConnectedAccounts) {
  //     return;
  //   }

  // getConnectedTabsUrl()
  //   .then((tabsUrl) => setConnectedTabsUrl(tabsUrl))
  //   .catch(console.error);
  // }, [showConnectedAccounts]);

  const _onBackArrowClick = useCallback(() => onAction('..'), [onAction]);
  const _goToRoot = useCallback(() => onAction('/'), [onAction]);

  return (
    <div className={`${className} ${smallMargin ? 'smallMargin' : ''} header`}>
      <div className='container'>
        <div className='branding'>
          {withBackArrow ? (
            <FontAwesomeIcon
              className='arrowLeftIcon'
              icon={faArrowLeft}
              onClick={withGoToRoot ? _goToRoot : _onBackArrowClick}
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
          {withHelp && (
            <Tooltip text={t<string>('Help')}>
              <Link to={'/help'}>
                <Svg
                  className='popupToggle'
                  src={helpIcon}
                />
              </Link>
            </Tooltip>
          )}
          {withSettings && (
            <Tooltip text={t<string>('Settings')}>
              <Link to={'/account/settings'}>
                <Svg
                  className='popupToggle'
                  data-toggle-settings
                  src={settingsIcon}
                />
              </Link>
            </Tooltip>
          )}
        </div>
        {/* TODO: will be reused */}
        {/* {isSettingsOpen && <MenuSettings reference={setMenuRef} />} */}
        {children}
      </div>
    </div>
  );
}

export default React.memo(
  styled(Header)(
    ({ theme, withSettings, withStepper }: Props) => `
  max-width: 100%;
  box-sizing: border-box;
  font-weight: normal;
  margin: 0;
  position: sticky;
  margin-bottom: ${withStepper ? '0px' : '25px'};

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
    border-bottom: ${withStepper ? 'none' : `1px solid ${theme.boxBorderColor}`};

    .branding {
      display: flex;
      align-items: center;
      color: ${theme.labelColor};
      font-family: ${theme.secondaryFontFamily};
      text-align: center;
      padding-left: 18px;

      .logo {
        height: 24px;
        width: 24px;
      }
    }

    .logoText-container {
      display:flex;
      align-items: center;
      justify-content: center;
      margin-left: ${withSettings ? '16px' : '0px'};
      width: 100%;

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
      justify-content: flex-end;
      gap: 16px;

      :last-child {
        padding-right: 18px;
      }
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
      width: 20px;
      height: 20px;

      &:hover {
        cursor: pointer;
        background: ${theme.headerIconBackgroundHover};
      }
    }

    .inputFilter {
      width: 100%
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
    cursor: pointer;

    :hover {
      path {
        fill: ${theme.headerIconBackgroundHover};
    }
}

  &.smallMargin {
    margin-bottom: 15px;
  }
`
  )
);
