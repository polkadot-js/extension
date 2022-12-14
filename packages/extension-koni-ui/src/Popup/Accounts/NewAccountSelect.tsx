// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';
import { faPlug } from '@fortawesome/free-solid-svg-icons/faPlug';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@subwallet/extension-koni-ui/components';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/useIsPopup';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';

import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const createAccountPath = '/account/create';

const NewAccountSelect = ({ className }: Props) => {
  const { t } = useTranslation();

  const isPopup = useIsPopup();
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  const _openCreateAccount = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', createAccountPath);
      windowOpen(createAccountPath).catch((e) => console.log('error', e));
    }, []
  );

  return (
    <div className={CN(className)}>
      <Header
        showBackArrow={true}
        showSubHeader={true}
        subHeaderName={t<string>('New account')}
      />
      <div className='menu-setting-item-list'>
        <Link
          className='menu-setting-item'
          onClick={isPopup && (isFirefox || isLinux) ? _openCreateAccount : undefined}
          to={isPopup && (isFirefox || isLinux) ? undefined : createAccountPath}
        >
          <FontAwesomeIcon icon={faCog} />
          <div className='menu-setting-item__text'>{t<string>('Create with new seed phrase')}</div>
          {/* @ts-ignore */}
          <div className='menu-setting-item__toggle' />
        </Link>

        <Link
          className='menu-setting-item'
          to='/account/derive'
        >
          <FontAwesomeIcon icon={faPlug} />
          <div className='menu-setting-item__text'>{t<string>('Derive from a account')}</div>
          <div className='menu-setting-item__toggle' />
        </Link>
      </div>
    </div>
  );
};

export default React.memo(styled(NewAccountSelect)(({ theme }: Props) => `
  .menu-setting-item-list {
    padding: 12px 22px;
    flex: 1;
    overflow: auto;
  }

  .menu-setting-item {
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
    padding: 11px;
    opacity: 1;

    .svg-inline--fa {
      color: ${theme.iconNeutralColor};
      margin-right: 11px;
      width: 15px;
    }
  }

  .menu-setting-item:hover {
    background-color: ${theme.backgroundAccountAddress};
    cursor: pointer;

    .svg-inline--fa,
    .menu-setting-item__text {
      color: ${theme.buttonTextColor2};
    }

    .menu-setting-item__toggle {
      color: ${theme.textColor};
    }
  }

  .menu-setting-item__text {
    font-size: 18px;
    line-height: 30px;
    font-weight: 500;
    color: ${theme.textColor2};
  }

  .menu-setting-item__toggle {
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(-45deg);
    right: 25px;
    color: ${theme.textColor2};
  }
`));
