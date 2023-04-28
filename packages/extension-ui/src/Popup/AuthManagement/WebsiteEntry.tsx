// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo } from '@polkadot/extension-base/background/handlers/State';

import chevronIcon from '../../assets/chevron.svg';
import { Svg } from '../../components/';
import { ActionContext } from '../../components/contexts';
import useTranslation from '../../hooks/useTranslation';
import { getFaviconUrl } from '../../util/getFaviconUrl';

interface Props extends ThemeProps {
  className?: string;
  info: AuthUrlInfo;
  url: string;
  tabIndex?: number;
}

function WebsiteEntry({
  className = '',
  info: { authorizedAccounts, isAllowed },
  tabIndex,
  url
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [favicon, setFavicon] = useState<string>('');
  const onAction = useContext(ActionContext);
  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);
  const origin = new URL(decodeURIComponent(url)).origin;
  const strippedUrl = origin.replace(/^https?:\/\//, '');

  useEffect(() => {
    async function fetchFavicon() {
      const url = await getFaviconUrl(origin);

      setFavicon(url);
    }

    fetchFavicon().catch(console.error);
  }, [origin]);

  return (
    <div
      className={className}
      onClick={_goTo(`/url/manage?url=${encodeURIComponent(url)}`)}
      onKeyPress={_goTo(`/url/manage?url=${encodeURIComponent(url)}`)}
      tabIndex={tabIndex}
    >
      <div className='url-group'>
        <img
          className='favicon'
          src={favicon}
        />
        <div className='url'>{strippedUrl}</div>
      </div>
      <div className='accounts-group'>
        <span className='number-of-accounts'>
          {authorizedAccounts && authorizedAccounts.length
            ? t('{{total}} accounts', { replace: { total: authorizedAccounts.length } })
            : isAllowed
            ? t('all accounts')
            : t('no accounts')}
        </span>
        <Svg
          className='chevron'
          src={chevronIcon}
        />
      </div>
    </div>
  );
}

export default styled(WebsiteEntry)(
  ({ theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  background: ${theme.menuBackground};
  height: 48px;
  transition: 0.2s ease;

  .accounts-group {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  &:hover, &:focus {
    cursor: pointer;
    background: ${theme.editCardBackgroundHover};
  
    .chevron {
      background: ${theme.headerIconBackgroundHover};
    }
  }

  .url {
    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 120%;
    letter-spacing: 0.07em;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .url-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .connectedAccounts {
    margin-left: .5rem;
    background-color: ${theme.primaryColor};
    color: white;
    cursor: pointer;
    padding: 0 0.5rem;
    border-radius: 4px;
    text-decoration: none;
  }

  .favicon {
    width: 20px;
    height: 20px;
  }

  .chevron {
    width: 16px;
    height: 16px;
    background: ${theme.iconNeutralColor};
  }

  &:hover .chevron {
    background: ${theme.headerIconBackgroundHover};
  }

  .number-of-accounts {
    font-family: ${theme.primaryFontFamily};
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    display: flex;
    align-items: center;
    letter-spacing: 0.07em;
    color: ${theme.subTextColor};
  }
`
);
