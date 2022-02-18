// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo, AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import Header from '@polkadot/extension-koni-ui/partials/Header';

import useTranslation from '../../hooks/useTranslation';
import { getAuthList, toggleAuthorization } from '../../messaging';
import { InputFilter } from './../../components';
import WebsiteEntry from './WebsiteEntry';

interface Props extends ThemeProps {
  className?: string;
}

function AuthManagement ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [authList, setAuthList] = useState<AuthUrls | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getAuthList()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
  }, []);

  const toggleAuth = useCallback((url: string) => {
    toggleAuthorization(url)
      .then(({ list }) => setAuthList(list))
      .catch(console.error);
  }, []);

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        smallMargin
        subHeaderName={t<string>('Manage Website Access')}
      />
      <>
        <div className={className}>
          <div className='auth-list-wrapper'>
            <InputFilter
              onChange={_onChangeFilter}
              placeholder={t<string>('example.com')}
              value={filter}
              withReset
            />
            <div>
              {
                !authList || !Object.entries(authList)?.length
                  ? <div className='empty-list'>{t<string>('No website request yet!')}</div>
                  : <>
                    <div className='website-list'>
                      {Object.entries(authList)
                        .filter(([url]: [string, AuthUrlInfo]) => url.includes(filter))
                        .map(
                          ([url, info]: [string, AuthUrlInfo]) =>
                            <WebsiteEntry
                              info={info}
                              key={url}
                              toggleAuth={toggleAuth}
                              url={url}
                            />
                        )}
                    </div>
                  </>
              }
            </div>
          </div>
        </div>
      </>
    </>
  );
}

export default styled(AuthManagement)`
  height: calc(100vh - 2px);
  overflow-y: auto;

  .auth-list-wrapper {
    margin: 0 15px;
  }

  .website-list {
    margin-top: 7px;
    height: 380px;
    overflow: auto;
  }

  .empty-list {
    text-align: center;
    padding-top: 10px;
  }
`;
