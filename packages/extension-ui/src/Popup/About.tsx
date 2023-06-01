// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import alephMark from '../assets/alephMark.svg';
import * as LinksList from '../components/LinksList';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import Header from '../partials/Header';

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <Header
        text={t<string>('About Aleph Zero Signer')}
        withBackArrow
        withHelp
      />
      <Container>
        <Hero>
          <AlephLogo src={alephMark} />
          <HeroTextContainer>
            <Heading>{t<string>('Aleph Zero Signer')}</Heading>
            <Version>
              {t<string>('Version')}&nbsp;{t<string>('version-number')}
            </Version>
          </HeroTextContainer>
        </Hero>
        <Nav>
          <LinksList.Group>
            <LinksList.Item
              link={LINKS.GENERAL_INTRODUCTION}
              rightIcon='link'
              title={t<string>('Help & Support')}
            />
            <LinksList.Item
              link={LINKS.FEEDBACK}
              rightIcon='link'
              title={t<string>('Feedback')}
            />
          </LinksList.Group>
          <LinksList.Group>
            <LinksList.Item
              link={LINKS.TERMS_OF_SERVICE}
              rightIcon='link'
              title={t<string>('Terms of Service')}
            />
            <LinksList.Item
              link={LINKS.PRIVACY_POLICY}
              rightIcon='link'
              title={t<string>('Privacy Policy')}
            />
          </LinksList.Group>
          <LinksList.Group>
            <LinksList.Item
              link={LINKS.MAIN_WEBSITE}
              rightIcon='link'
              title={t<string>('Visit Website')}
            />
          </LinksList.Group>
        </Nav>
      </Container>
    </>
  );
};

export default About;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  color: ${({ theme }) => theme.textColor};
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Hero = styled.div``;

const AlephLogo = styled.img`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const HeroTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 34px;
  margin-bottom: 36px;
`;

const Heading = styled.span`
  font-family: ${({ theme }) => theme.secondaryFontFamily};
  font-style: normal;
  font-weight: bold;
  font-size: 24px;
  line-height: 118%;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.03em;
  `;

const Version = styled.span`
  font-style: normal;
  font-weight: 300;
  font-size: 14px;
  line-height: 145%;
  display: flex;
  align-items: center;
  text-align: center;
  letter-spacing: 0.07em;
  color: ${({ theme }) => theme.subTextColor}
`;

const Nav = styled.nav``;
