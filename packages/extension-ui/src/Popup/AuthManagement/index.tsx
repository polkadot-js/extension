// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AuthUrlInfo, AuthUrls } from '@polkadot/extension-base/background/handlers/State';

import animTrusted from '../../assets/anim_trusted.svg';
import helpIcon from '../../assets/help.svg';
import { AnimatedSvg, ButtonArea, LearnMore, ScrollWrapper, Svg, VerticalSpace } from '../../components';
import HelperFooter from '../../components/HelperFooter';
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
          <div className='empty-list'>
            <AnimatedSvg
              className='animated-trusted'
              src={animTrusted}
            />
            <span className='heading'>{t<string>('No app request yet')}</span>
            <span className='subtitle'>
              {t<string>(
                'This view will contain a list of apps and associated accounts that you have granted the Trusted status. The requests are initiated by apps.'
              )}
            </span>
          </div>
        ) : (
          <CustomScrollWrapper>
            <div className='website-list'>
              {Object.entries<AuthUrlInfo>(authList).map(([url, info]) => (
                <WebsiteEntry
                  info={info}
                  key={url}
                  url={url}
                  tabIndex={0}
                />
              ))}
            </div>
          </CustomScrollWrapper>
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

  .empty-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
    margin-top: 56px;
  }

  .inputFilter {
    margin-bottom: 0.8rem;
    padding: 0 !important;
  }

  .animated-trusted {
    width: 96px;
    height: 96px;
  }
  

  .heading {
      font-weight: 700;
      font-size: 24px;
      line-height: 118%;
      letter-spacing: 0.03em;
      font-family: ${({ theme }: ThemeProps) => theme.secondaryFontFamily};

    }

    .subtitle {
      font-weight: 300;
      font-size: 14px;
      line-height: 145%;
      text-align: center;
      letter-spacing: 0.07em; 
      color: ${({ theme }: ThemeProps) => theme.subTextColor};
      padding: 0 8px;
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
