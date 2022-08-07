// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { setNotification } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import getLanguageOptions from '@subwallet/extension-koni-ui/util/getLanguageOptions';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import settings from '@polkadot/ui-settings';

import { Dropdown, MenuItem } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
}

const notificationOptions = ['Extension', 'PopUp', 'Window']
  .map((item) => ({ text: item, value: item.toLowerCase() }));

function GeneralSetting ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [notification, updateNotification] = useState(settings.notification);
  const [language, updateLanguage] = useState(settings.i18nLang === 'default' ? 'en' : settings.i18nLang);
  const languageOptions = useMemo(() => getLanguageOptions(), []);

  const _onChangeNotification = useCallback(
    (value: string): void => {
      setNotification(value).catch(console.error);

      updateNotification(value);
      settings.set({ notification: value });
    },
    []
  );

  const _onChangeLang = useCallback(
    (value: string): void => {
      updateLanguage(value);
      settings.set({ i18nLang: value });
    },
    []
  );

  return (
    <>
      <div className={className}>
        <Header
          showBackArrow
          showSubHeader
          subHeaderName={t<string>('General Setting')}
          to='/account/settings'
        />
        <MenuItem
          className='setting'
          title={t<string>('Language')}
        >
          <Dropdown
            className='dropdown'
            label=''
            onChange={_onChangeLang}
            options={languageOptions}
            value={language}
          />
        </MenuItem>
        <MenuItem
          className='setting'
          title={t<string>('Notifications')}
        >
          <Dropdown
            className='dropdown'
            label=''
            onChange={_onChangeNotification}
            options={notificationOptions}
            value={notification}
          />
        </MenuItem>
      </div>
    </>
  );
}

export default styled(GeneralSetting)(({ theme }: Props) => `
  margin-top: -25px;
  padding-top: 25px;

  .settings__theme-setting {
    padding-top: 14px;
    .horizontal-label {
      font-size: 18px;
      line-height: 30px;
    }
  }

  .menu-items-wrapper {
    display: flex;
    align-items: center;
  }

  .settings-menu-divider {
    padding-top: 0;
  }

  .manage-website-access, .setting__action-text {
    > span {
      font-size: 16px;
      line-height: 26px;
      color: ${theme.textColor2};
      font-weight: 400;
    }
  }

  .checkbox {
    margin: 6px 0 14px 0;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`);
