// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import useTranslation from '../hooks/useTranslation';
import { Header } from '../partials';

interface Props extends ThemeProps {
  className?: string;
}

function PhishingDetected ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header text={t<string>('Phishing detected')} />
      <div className={className}>
        <p>
          {t<string>('You have been redirected because the Polkadot{.js} extension believes that this website could compromise the security of your accounts.')}
        </p>
        <p>
          {t<string>('The redirection could also happen on an outright malicious website or on a legitimate websites that has been compromised and flagged.')}
        </p>
        <p>
          {t<string>('This redirection is based on a list of websites accessible at https://github.com/polkadot-js/phishing. Note that this is a community-driven, curated list. \n It might be incomplete or inaccurate.')}
        </p>
        <p>
          <Trans i18nKey='phishing.incorrect'>
            If you think that this website was flagged incorrectly, <a href='https://github.com/polkadot-js/phishing/issues/new'>please open an issue by clicking here</a>.
          </Trans>
        </p>
      </div>
    </>
  );
}

export default styled(PhishingDetected)(({ theme }: Props) => `
  p {
    color: ${theme.subTextColor};
    margin-bottom: 1rem;
    margin-top: 0;

    a {
      color: ${theme.subTextColor};
    }
  }
`);
