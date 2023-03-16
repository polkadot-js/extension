// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import partnerLogo from '../assets/partnerLogo.svg';
import secureIMG from '../assets/secure.png';
import { ActionContext, Button, ButtonArea, LearnMore, List, Svg, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';

interface Props extends ThemeProps {
  className?: string;
}

const Welcome = function ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback((): void => {
    window.localStorage.setItem('welcome_read', 'ok');
    onAction();
  }, [onAction]);

  return (
    <>
      <div className={className}>
        <img
          className='centered-img'
          src={secureIMG}
        />
        <span className='heading'>{t<string>('Your privacy is protected')}</span>
        <List>
          <li>{t<string>('Aleph Zero Signer does not send any clicks, pageviews, and events to external servers')}</li>
          <li>{t<string>('Aleph Zero Signer does not use any analytics')}</li>
          <li>
            {t<string>(
              'All your data stays on this device: your secret phrases, addresses, and any other information are only stored locally'
            )}
          </li>
        </List>
        <div className='partner'>
          <Svg
            className='partner-logo'
            src={partnerLogo}
          />
          <span className='subtitle'>
            {t<string>('For extra protection, we highly recommend using the')}&nbsp;
            <LearnMore href={LINKS.PARTNER}>{t<string>('Threat Slayer extension')} </LearnMore>
            &nbsp;
            {t<string>('which scan every website you visit in real-time.')}
          </span>
        </div>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button onClick={_onClick}>{t<string>('Got it!')}</Button>
      </ButtonArea>
    </>
  );
};

export default styled(Welcome)(
  ({ theme }: Props) => `

  display: flex;
  flex-direction: column;

  .centered-img {
    justify-content: center;
    display: flex;
    margin: 8px auto;
    width: 144px;
    height: 144px;
  }
  
  .heading {
    font-family: ${theme.secondaryFontFamily};
    font-weight: 700;
    font-size: 20px;
    line-height: 120%;
    text-align: center;
    margin: 0 auto;
    letter-spacing: 0.035em;
    color: ${theme.textColor};
  }

  .partner {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 12px;
    gap: 16px;
    border: 1px solid ${theme.boxBorderColor};
    border-radius: 8px;

    .partner-logo {
      width: 34px;
      height: 35px;
      background: #fff
    }
  }



  .subtitle {
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: left;
    letter-spacing: 0.07em; 
    color: ${theme.subTextColor};
    white-space: pre-line;
    width: 246px;
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
