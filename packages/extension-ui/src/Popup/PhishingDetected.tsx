// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps as Props } from '../types';

import React from 'react';
import styled from 'styled-components';

import useTranslation from '../hooks/useTranslation';
import { Header } from '../partials';
import { Trans } from 'react-i18next';

export default function PhishingDetected (): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header text={t<string>('Phishing detected')} />
      <Note>
        {t<string>(`You have been redirected because the Polkadot{.js} extension believes that this website could compromise the
        security of your accounts.`)}
      </Note>
      <Note>
        {t<string>(`
          The redirection could also happen on an outright malicious website or on a legitimate websites that has been compromised and flagged.
      `)}
      </Note>
      <Note>
        {t<string>(`
          This redirection is based on a list of websites accessible at https://github.com/polkadot-js/phishing. Note that this is a community-driven, curated list.
          It might be incomplete or inaccurate.
      `)}
      </Note>
      <Note>
        <Trans key='phishing.incorrect'>If you think that this website was flagged incorrectly,
          <IssueLink href='https://github.com/polkadot-js/phishing/issues/new'>please open an issue by clicking here</IssueLink>.
        </Trans>
      </Note>
    </>
  );
}

const Note = styled.p(({ theme }: Props) => `
  color: ${theme.subTextColor};
  margin-bottom: 1rem;
  margin-top: 0;
`);

const IssueLink = styled.a(({ theme }: Props) => `
  color: ${theme.subTextColor};
`);
