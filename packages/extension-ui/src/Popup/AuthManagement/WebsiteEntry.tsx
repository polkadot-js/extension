// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AuthUrlInfo } from '@polkadot/extension-base/background/types';

import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';

import RemoveAuth from '../../components/RemoveAuth.js';
import { useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';

interface Props {
  className?: string;
  info: AuthUrlInfo;
  removeAuth: (url: string) => void;
  url: string;
}

function WebsiteEntry ({ className = '', info: { authorizedAccounts, isAllowed }, removeAuth, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const _removeAuth = useCallback(
    () => removeAuth(url),
    [removeAuth, url]
  );

  return (
    <div className={className}>
      <RemoveAuth onRemove={_removeAuth} />
      <div className='url'>
        {url}
      </div>
      <Link
        className='connectedAccounts'
        to={`/url/manage/${encodeURIComponent(url)}`}
      >{
          authorizedAccounts?.length
            ? t('{{total}} accounts', {
              replace: {
                total: authorizedAccounts.length
              }
            })
            : isAllowed
              ? t('all accounts')
              : t('no accounts')
        }</Link>
    </div>
  );
}

export default styled(WebsiteEntry)<Props>`
  display: flex;
  align-items: center;
  margin-top: .2rem;

  .url{
    flex: 1;
  }

  .connectedAccounts{
    margin-left: .5rem;
    background-color: var(--primaryColor);
    color: white;
    cursor: pointer;
    padding: 0 0.5rem;
    border-radius: 4px;
    text-decoration: none;
  }
`;
