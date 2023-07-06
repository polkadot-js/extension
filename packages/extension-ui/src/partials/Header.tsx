// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import connectionStatus from '../assets/anim_connection_status.svg';
import arrowLeft from '../assets/arrow-left.svg';
import logo from '../assets/azeroLogo.svg';
import helpIcon from '../assets/help.svg';
import notConnected from '../assets/not_connected.svg';
import settingsIcon from '../assets/settings.svg';
import { ActionContext, Link, Svg, Tooltip } from '../components';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import { getConnectedTabsUrl } from '../messaging';
import { triggerOnEnterSpace } from '../util/keyDownWrappers';
import { Z_INDEX } from '../zindex';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  onFilter?: (filter: string) => void;
  withBackArrow?: boolean;
  withConnectedAccounts?: boolean;
  withHelp?: boolean;
  withSettings?: boolean;
  smallMargin?: boolean;
  withBackdrop?: boolean;
  text?: React.ReactNode;
  withStepper?: boolean;
  goToFnOverride?: () => void;
}

function Header({
  children,
  className = '',
  goToFnOverride,
  smallMargin = false,
  text,
  withBackArrow,
  withConnectedAccounts,
  withHelp,
  withSettings
}: Props): React.ReactElement<Props> {
  const [connectedTabsUrl, setConnectedTabsUrl] = useState<string[]>([]);
  const { t } = useTranslation();

  const isConnected = useMemo(() => connectedTabsUrl.length >= 1, [connectedTabsUrl]);
  const onAction = useContext(ActionContext);

  useEffect(() => {
    if (!withConnectedAccounts) {
      return;
    }

    getConnectedTabsUrl()
      .then((tabsUrl) => setConnectedTabsUrl(tabsUrl))
      .catch(console.error);
  }, [withConnectedAccounts]);

  const _onBackArrowClick = useCallback(() => onAction('..'), [onAction]);

  return (
    <>
      <div
        className={`${className} ${smallMargin ? 'smallMargin' : ''}header`}
      >
        <div className='container'>
          <div className='branding'>
            {withBackArrow ? (
              <div
                className='arrow-container'
                onClick={goToFnOverride || _onBackArrowClick}
                onKeyDown={triggerOnEnterSpace(goToFnOverride || _onBackArrowClick)}
                tabIndex={0}
              >
                <Svg
                  className='arrowLeftIcon'
                  src={arrowLeft}
                />
              </div>
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
            <span className='logoText'>{text || t<string>('Aleph Zero Signer')}</span>
          </div>
          <div className='popupMenus'>
            {withHelp && (
              <Tooltip text={t<string>('Help')}>
                <a
                  className='focused-icon'
                  href={LINKS.GENERAL_INTRODUCTION}
                  rel='noreferrer'
                  target='_blank'
                >
                  <Svg
                    className='popupToggle'
                    src={helpIcon}
                  />
                </a>
              </Tooltip>
            )}
            {withSettings && (
              <Tooltip text={t<string>('Settings')}>
                <Link
                  className='focused-icon'
                  to={'/account/settings'}
                >
                  <Svg
                    className='popupToggle'
                    data-toggle-settings
                    src={settingsIcon}
                  />
                </Link>
              </Tooltip>
            )}
          </div>
          {children}
        </div>
        {withConnectedAccounts && (
          <div className='connectedAccountsWrapper'>
            {isConnected ? (
              <Link
                className='connectedAccounts'
                to={connectedTabsUrl.length === 1 ? `/url/manage?url=${connectedTabsUrl[0]}` : '/auth-list'}
              >
                <img
                  className='greenDot'
                  src={connectionStatus}
                />
                <span>Connected</span>
              </Link>
            ) : (
              <div className='connectedAccounts with-green-dot'>
                <img
                  className='greenDot'
                  src={notConnected}
                />
                <div>Not Connected</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
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
  top: 0px;
  backdrop-filter: blur(10px);
  z-index: ${Z_INDEX.HEADER};

  && {
    padding: 0 0 0;
  }

  .flex {
    display: flex;
  }

  .arrow-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;

    :focus {
      ${Svg} {
        background: ${theme.headerIconBackgroundHover};
      }
    }
  }

  .connectedAccountsWrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 0;
    left: 0;
    top: 45px;
    height: 22px;
    padding: 4px 8px;
    box-sizing: border-box;
    border-radius: 2px;
    background: ${theme.connectedIndicator};
    border: 1px solid ${theme.boxBorderColor};
    margin: 0 auto;
    width: fit-content;
    transition: 0.2s ease;
  }

  .connectedAccounts {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.subTextColor};
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
    gap: 4px;
    transition: 0.2s ease;

    .greenDot {
      width: 20px;
      height: 20px;
      color: ${theme.connectedDotColor};
    }

    .with-green-dot:hover {
      background: ${theme.connectedIndicatorHover};
    }
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
      margin-left: ${withSettings ? '32px' : '0px'};
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
      align-items: center;

      :last-child {
        padding-right: 18px;
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
      background: ${theme.iconNeutralColor};
      transition: 0.2s ease;

      &:hover {
        cursor: pointer;
        background: ${theme.headerIconBackgroundHover};
      }

      &:active {
        margin-top: 3px;
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
    width: 20px;
    height: 20px;
    background: ${theme.iconNeutralColor};

    :hover, :focus {
      background: ${theme.headerIconBackgroundHover};
    }

    &:active {
      margin-top: 3px;
    }
  }

  &.smallMargin {
    margin-bottom: 15px;
  }

  .focused-icon {
    :focus {
      ${Svg} {
        background: ${theme.headerIconBackgroundHover};
      }
    }
  }
`
  )
);
