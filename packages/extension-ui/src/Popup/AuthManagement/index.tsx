// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo, AuthUrls } from '@polkadot/extension-base/background/handlers/State';

import helpIcon from '../../assets/help.svg';
import { ButtonArea, Svg, VerticalSpace } from '../../components';
import HelperFooter from '../../components/HelperFooter';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList } from '../../messaging';
import { Header } from '../../partials';
import WebsiteEntry from './WebsiteEntry';

interface Props extends ThemeProps {
  className?: string;
}

const CustomButtonArea = styled(ButtonArea)`
  .footer {
    display: flex;
    justify-content: flex-start;
  }
`;

const CustomFooter = styled(HelperFooter)`
  margin-bottom: 8px;
  gap: 8px;
  justify-content: flex-start;
`;

function AuthManagement({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [authList, setAuthList] = useState<AuthUrls | null>(null);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const hasAuthList = useMemo(() => !!authList && !!Object.keys(authList).length, [authList]);

  const footer = (
    <CustomFooter>
      <Svg
        className='icon'
        src={helpIcon}
      />
      <span>
        {t<string>('What are trusted apps?')}&nbsp;
        <span className='link'>{` ${t<string>('Learn more')}`}</span>
      </span>
    </CustomFooter>
  );

  return (
    <>
      <Header
        smallMargin
        text={t<string>('Trusted Apps')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        {!authList || !hasAuthList ? (
          <div className='empty-list'>{t<string>('No website request yet!')}</div>
        ) : (
          <>
            <div className='website-list'>
              {Object.entries<AuthUrlInfo>(authList).map(([url, info]) => (
                <WebsiteEntry
                  info={info}
                  key={url}
                  url={url}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <VerticalSpace />
      <CustomButtonArea footer={footer} />
    </>
  );
}

export default styled(AuthManagement)`
  height: calc(100vh - 2px);
  overflow-y: auto;

  .empty-list{
    text-align: center;
  }

  .inputFilter{
    margin-bottom: 0.8rem;
    padding: 0 !important;
  }

  .website-list {
    margin-top: 4px;

    ${WebsiteEntry}:first-child {
        border-radius: 8px 8px 2px 2px;
        margin-bottom: 2px;
    }

    ${WebsiteEntry}:last-child {
        border-radius: 2px 2px 8px 8px;
        margin-top: 2px;
    }

    ${WebsiteEntry}:only-child {
        border-radius: 8px;
    }
  }
`;
