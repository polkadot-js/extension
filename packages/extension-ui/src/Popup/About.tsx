// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import alephMark from '../assets/alephMark.svg';
import { EditMenuCard } from '../components';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import Header from '../partials/Header';

interface Props extends ThemeProps {
  className?: string;
}

const AboutMenuCard = styled(EditMenuCard)`
  padding: 0px 16px;
  margin-bottom: 16px;
  border-radius: 8px;
`;

function About({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header
        text={t<string>('About Aleph Zero Signer')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        <img
          className='aleph-mark'
          src={alephMark}
        />
        <div className='text'>
          <span className='heading'>{t<string>('Aleph Zero Signer')}</span>
          <span className='version-subtitle'>
            {t<string>('Version')}&nbsp;{t<string>('version-number')}
          </span>
        </div>
        <AboutMenuCard
          description=''
          extra='link'
          link={LINKS.GENERAL_INTRODUCTION}
          position='bottom'
          title={t<string>('Help & Support')}
        />
        <AboutMenuCard
          description=''
          extra='link'
          link={LINKS.TERMS_OF_SERVICE}
          position='bottom'
          title={t<string>('Terms of Service')}
        />
        <AboutMenuCard
          description=''
          extra='link'
          link={LINKS.PRIVACY_POLICY}
          position='bottom'
          title={t<string>('Privacy Policy')}
        />
        <AboutMenuCard
          description=''
          extra='link'
          link={LINKS.MAIN_WEBSITE}
          position='bottom'
          title={t<string>('Visit Website')}
        />
      </div>
    </>
  );
}

export default React.memo(
  styled(About)(
    ({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  height: calc(100vh - 2px);
  overflow-y: scroll;
  scrollbar-width: none;
  margin-top: 38px;
      
  &::-webkit-scrollbar {
    display: none;
  }

  .icon {
    width: 20px;
    height: 20px;
    background: ${theme.primaryColor};
  }

  .aleph-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 34px;
    margin-bottom: 36px;

    .heading {
      font-family: ${theme.secondaryFontFamily};
      font-style: normal;
      font-weight: bold;
      font-size: 24px;
      line-height: 118%;
      display: flex;
      align-items: center;
      text-align: center;
      letter-spacing: 0.03em;
    }

    .version-subtitle {
      font-style: normal;
      font-weight: 300;
      font-size: 14px;
      line-height: 145%;
      display: flex;
      align-items: center;
      text-align: center;
      letter-spacing: 0.07em;
      color: ${theme.subTextColor}
    }
  }

  `
  )
);
