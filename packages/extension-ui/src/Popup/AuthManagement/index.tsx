// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo } from '@polkadot/extension-base/background/handlers/State';

import useTranslation from '../../hooks/useTranslation';
import { getAuthList } from '../../messaging';
import { Header } from '../../partials';
import WebsiteEntry from './WebsiteEntry';

interface Props extends ThemeProps {
  className?: string;
}

function AuthManagement ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [authList, setAuthList] = useState<[string, AuthUrlInfo][] | null>(null);

  useEffect(() => {
    getAuthList().then(
      ({ list }) => setAuthList(Object.entries(list))
    ).catch((e) => console.error(e)
    );
  }, []);

  return (
    <>
      <Header
        showBackArrow
        text={t<string>('Manage Website Access')}
      />
      <div className={className}>
        { !authList?.length
          ? <div className='empty-list'>{t<string>('No website request yet!')}</div>
          : authList.map(
            ([url, info]: [string, AuthUrlInfo]) =>
              <WebsiteEntry
                info={info}
                key={url}
                url={url}
              />
          )}
      </div>
    </>
  );
}

export default styled(AuthManagement)`
  .empty-list {
    text-align: center;
  }
`;
