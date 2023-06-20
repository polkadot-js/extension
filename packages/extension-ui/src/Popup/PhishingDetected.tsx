// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import animatedDanger from '../assets/anim_danger.svg';
import { Button, ButtonArea, FaviconBox, LearnMore, PopupBorderContainer, Svg, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';

interface Props extends ThemeProps {
  className?: string;
}

interface WebsiteState {
  website: string;
}

const StyledFaviconBox = styled(FaviconBox)`
  margin: 8px 0px;
`;

function PhishingDetected({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { website } = useParams<WebsiteState>();

  const origin = getWebsiteOriginFromEncodedUrl(website);

  const _onClick = useCallback(() => {
    window.close();
  }, []);

  return (
    <>
      <PopupBorderContainer>
        <div className={className}>
          <div className='content'>
            <div className='content-inner'>
              <Svg
                className='danger-icon'
                src={animatedDanger}
              />
              <span className='heading'>{t<string>('Phishing detected')}</span>
              <span className='subtitle'>
                {t<string>(
                  "You have been redirected because you've entered a website that could compromise the security of your assets"
                )}
              </span>
              <StyledFaviconBox url={origin} />
              <span className='subtitle'>
                {t<string>(
                  'We have found it on a list of phishing websites that is community-driven and maintained by Parity Technologies. If you think that this website has been flagged incorrectly, open an issue'
                )}
                &nbsp;
                <LearnMore href={LINKS.PHISHING}>{t<string>('here')}</LearnMore>
              </span>
            </div>
          </div>
        </div>
      </PopupBorderContainer>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={_onClick}
          secondary
        >
          {t<string>('Got it!')}
        </Button>
      </ButtonArea>
    </>
  );
}

const getWebsiteOriginFromEncodedUrl = (encodedUrl: string) => {
  const decodedWebsite = decodeURIComponent(encodedUrl);

  return new URL(decodedWebsite).origin;
};

export default styled(PhishingDetected)(
  ({ theme }: Props) => `
  .content {
    border-radius: 32px;
    height: 584px;
    margin-top: 8px;
    overflow-y: hidden;
    overflow-x: hidden;
  }
  
  .content-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 64px;
    gap: 16px;
  }

  .subtitle {
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: center;
    letter-spacing: 0.07em; 
    color: ${theme.subTextColor};
    padding: 0 8px;
    white-space: pre-line;
  }


  .heading {
    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 700;
    font-size: 24px;
    line-height: 118%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.03em;
    color: ${theme.textColor};
  }

  .danger-icon {
    background: ${theme.dangerBackground};
    width: 96px;
    height: 96px;
  }

  .link {
    color: ${theme.primaryColor};
    cursor: pointer;
    text-decoration: none;

    :hover {
      text-decoration: underline;
    }
  }
`
);
