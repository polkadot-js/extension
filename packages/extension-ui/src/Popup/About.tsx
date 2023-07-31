import React from 'react';
import styled from 'styled-components';

import { Hero } from '../components';
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
        <StyledHero
          headerText={t<string>('Aleph Zero Signer')}
          iconType='aleph'
        >
          {t<string>('Version')}&nbsp;{t<string>('version-number')}
        </StyledHero>
        <nav>
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
        </nav>
      </Container>
    </>
  );
};

const Container = styled.div`
  color: ${({ theme }) => theme.textColor};
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;
  padding-top: 32px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledHero = styled(Hero)`
  margin-bottom: 32px;
`;

export default React.memo(About);
