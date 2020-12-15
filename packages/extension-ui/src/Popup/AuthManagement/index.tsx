// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo, AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import { Input } from '@polkadot/extension-ui/components/TextInputs';

import useTranslation from '../../hooks/useTranslation';
import { getAuthList, toggleAuthorization } from '../../messaging';
import { Header } from '../../partials';
import WebsiteEntry from './WebsiteEntry';

interface Props extends ThemeProps {
  className?: string;
}

function AuthManagement ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [authList, setAuthList] = useState<AuthUrls | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getAuthList().then(
      ({ list }) => setAuthList(list)
    ).catch((e) => console.error(e)
    );
  }, []);

  const _onChangeFilter = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  }, []);

  const toggleAuth = useCallback((url: string) => {
    toggleAuthorization(url).then(({ list }) => {
      setAuthList(list);
    }).catch(console.error);
  }, []);

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Manage Website Access')}
      />
      <div className={className}>
        {!authList || !Object.entries(authList)?.length
          ? <div className='empty-list'>{t<string>('No website request yet!')}</div>
          : <>
            <div className='filter'>
              <Input
                autoCapitalize='off'
                autoCorrect='off'
                autoFocus
                onChange={_onChangeFilter}
                placeholder={t<string>('website.com')}
                spellCheck={false}
                type='text'
                value={filter}
              />
            </div>
            {Object.entries(authList)
              .filter(([url]:[string, AuthUrlInfo]) => url.includes(filter))
              .map(
                ([url, info]: [string, AuthUrlInfo]) =>
                  <WebsiteEntry
                    info={info}
                    key={url}
                    toggleAuth={toggleAuth}
                    url={url}
                  />
              )}
          </>}
      </div>
    </>
  );
}

export default styled(AuthManagement)`
  .empty-list {
    text-align: center;
  }

  .filter {
    margin-left: -1rem;
    margin-right: -1rem;
  }
`;
