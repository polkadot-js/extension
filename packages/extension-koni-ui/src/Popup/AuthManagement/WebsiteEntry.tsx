// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo } from '@polkadot/extension-base/background/handlers/State';
import { HorizontalLabelToggle } from '../../components';

import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  info: AuthUrlInfo;
  toggleAuth: (url: string) => void
  url: string;
}

function WebsiteEntry ({ className = '', info, toggleAuth, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const switchAccess = useCallback(() => {
    toggleAuth(url);
  }, [toggleAuth, url]);

  return (
    <div className={`${className} ${info.isAllowed ? 'allowed' : 'denied'}`}>
      <div className='url'>
        {url}
      </div>
      <HorizontalLabelToggle
        checkedLabel={t<string>('allowed')}
        className='info'
        toggleFunc={switchAccess}
        uncheckedLabel={t<string>('denied')}
        value={info.isAllowed}
      />
    </div>
  );
}

export default styled(WebsiteEntry)(({ theme }: Props) => `
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  .url{
    flex: 1;
    color: ${theme.manageWebsiteAccessColor};
    font-weight: 400;
  }

  .info {
    display: flex;
    align-items: center;
    .lightLabel {
      font-size: 15px;
      line-height: 32px;
      color: ${theme.textColor2};
    }

    .darkLabel {
      font-size: 15px;
      line-height: 32px;
      color: ${theme.textColor};
    }

    label {
      width: 43px;
      height: 24px;
    }

    .slider {
      background-color: ${theme.buttonBackground2};
    }

    .slider:before {
      width: 18px;
      height: 18px;
      left: 4px;
      background-color: #FFF;
    }

    .checkbox:checked + .slider:before {
      transform: translateX(18px);
    }
  }
`);
