// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import localStorageStores from '@polkadot/extension-base/utils/localStorageStores';

import partnerLogo from '../assets/partnerLogo.svg';
import { ActionContext, Button, ButtonArea, Hero, LearnMore, List, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';

interface Props extends ThemeProps {
  className?: string;
}

const Welcome = function ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback(async (): Promise<void> => {
    await localStorageStores.welcomeRead.set('ok');

    await onAction();
  }, [onAction]);

  return (
    <>
      <div className={className}>
        <Hero
          headerText={t<string>('Your privacy is protected')}
          iconType='secure'
        />
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
          <img
            className='partner-logo'
            src={partnerLogo}
          />
          <span className='subtitle'>
            {t<string>('For extra protection, we highly recommend using the')}&nbsp;
            <LearnMore href={LINKS.PARTNER}>{t<string>('Threat Slayer extension')}</LearnMore>
            &nbsp;{t<string>('which protects you from dangerous websites in real-time.')}
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

  margin-top: 40px;

  .partner {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 12px 12px 12px 16px;
    gap: 16px;
    border: 1px solid ${theme.boxBorderColor};
    border-radius: 8px;
    width: 328px;
    height: 104px;
    box-sizing: border-box;

    .partner-logo {
      width: 24px;
      height: 30px;
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
