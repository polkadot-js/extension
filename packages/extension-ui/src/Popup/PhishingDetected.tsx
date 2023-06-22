// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import backgroundMotif from '../assets/background_motif.svg';
import { FaviconBox, Hero, LearnMore, PopupBorderContainer, Svg } from '../components';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';

type Props = {
  className?: string;
};

interface WebsiteState {
  website: string;
}

function PhishingDetected(): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { website } = useParams<WebsiteState>();

  const origin = getWebsiteOriginFromEncodedUrl(website);

  return (
    <Container>
      <StyleSvg src={backgroundMotif} />
      <StyledPopupBorderContainer>
        <Hero
          headerText={t<string>('Phishing detected')}
          iconType='danger'
        >
          <Description>
            {t<string>(
              "You have been redirected because you've entered a website that could compromise the security of your assets."
            )}
          </Description>
          <StyledFaviconBox url={origin} />
          <Description>
            {t<string>(
              'We have found it on a list of phishing websites that is community-driven and maintained by Parity Technologies. If you think that this website has been flagged incorrectly, open an issue'
            )}
            &nbsp;<Link href={LINKS.PHISHING}>{t<string>('here')}</Link>.
          </Description>
        </Hero>
      </StyledPopupBorderContainer>
    </Container>
  );
}

const getWebsiteOriginFromEncodedUrl = (encodedUrl: string) => {
  const decodedWebsite = decodeURIComponent(encodedUrl);

  return new URL(decodedWebsite).origin;
};

const Container = styled.div`
  height: 100%;

  display: grid;
  justify-content: center;
  grid-template-rows: 1fr 600px 3fr;

  isolation: isolate;

  background: ${({ theme }) => theme.fullscreenBackground};
`;

const StyleSvg = styled(Svg)`
  position: absolute;
  z-index: -1;
  inset: 0;

  background-color: ${({ theme }) => theme.fullscreenBackgroundLines};
`;

const StyledPopupBorderContainer = styled(PopupBorderContainer)`
  padding: 3em 24px;
  grid-row-start: 2;

  box-sizing: border-box;

  width: 360px;
  height: 600px;

  border: 1px solid ${({ theme }) => theme.fullscreenBorderColor};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.boxBackground};
`;

const StyledFaviconBox = styled(FaviconBox)`
  margin-bottom: 24px;
`;

const Description = styled.p`
  margin-bottom: 24px;
`;

const Link = styled(LearnMore)`
  color: ${({ theme }) => theme.primaryColor};
  cursor: pointer;
  text-decoration: none;

  :hover {
    text-decoration: underline;
  }
`;

export default PhishingDetected;
