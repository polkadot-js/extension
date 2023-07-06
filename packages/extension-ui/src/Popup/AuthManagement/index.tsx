// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo, AuthUrls } from '@polkadot/extension-base/background/handlers/State';

import helpIcon from '../../assets/help.svg';
import { ButtonArea, HelperFooter, Hero, LearnMore, ScrollWrapper, Svg } from '../../components';
import { useGoTo } from '../../hooks/useGoTo';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';
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

  .wrapper {
    display: flex;
    gap: 8px;
    margin-right: 40px;
  };
`;

const CustomScrollWrapper = styled(ScrollWrapper)`
  ::-webkit-scrollbar-thumb {
    border-right: none;
    border-left: 4px solid rgb(17, 27, 36);
  }

  padding-right: 0px;
`;

function AuthManagement({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [authList, setAuthList] = useState<AuthUrls | null>(null);
  const { goTo } = useGoTo();

  useEffect(() => {
    getAuthList()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const hasAuthList = useMemo(() => !!authList && !!Object.keys(authList).length, [authList]);

  const footer = (
    <CustomFooter>
      <div className='wrapper'>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('What are trusted apps?')}&nbsp;
          <LearnMore href={LINKS.TRUSTED_APPS} />
        </span>
      </div>
    </CustomFooter>
  );

  return (
    <>
      <Header
        goToFnOverride={goTo('/account/settings')}
        text={t<string>('Trusted Apps')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        {!authList || !hasAuthList ? (
          <StyledHero
            headerText={t<string>('No app request yet')}
            iconType='trust'
          >
            {t<string>(
              'This view will contain a list of apps and associated accounts that you have granted the Trusted status. The requests are initiated by apps.'
            )}
          </StyledHero>
        ) : (
          <CustomScrollWrapper>
            <WebsiteListContainer>
              {Object.entries<AuthUrlInfo>(authList).map(([url, info]) => (
                <WebsiteEntry
                  info={info}
                  key={url}
                  tabIndex={0}
                  url={url}
                />
              ))}
            </WebsiteListContainer>
          </CustomScrollWrapper>
        )}
      </div>
      <CustomButtonArea footer={footer} />
    </>
  );
}

const StyledHero = styled(Hero)`
  margin-top: 64px;
  margin-inline: 16px;
`;

const WebsiteListContainer = styled.div`
  ${WebsiteEntry}:first-child {
      border-radius: 8px 8px 2px 2px;
  }

  ${WebsiteEntry}:last-child {
      border-radius: 2px 2px 8px 8px;
  }

  ${WebsiteEntry}:only-child {
      border-radius: 8px;
  }

  ${WebsiteEntry}:not(:last-child) {
      margin-bottom: 2px;
  }
`;

export default styled(AuthManagement)`
  flex-grow: 1;

  overflow-y: auto;

  display: flex;
  flex-direction: column;

  &&& {
    padding-inline: 0 !important;
  }

  .inputFilter {
    margin-bottom: 0.8rem;
    padding: 0 !important;
  }
`;
