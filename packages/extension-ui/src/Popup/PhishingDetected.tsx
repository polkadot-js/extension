// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps as Props } from '../types';

import React from 'react';
import styled from 'styled-components';

import useTranslation from '../hooks/useTranslation';
import { Header } from '../partials';

export default function PhishingDetected (): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header text={t<string>('Phishing detected')} />
      <Note>
        {t<string>(`This domain is currently on the Polkadot-js domain warning list. This means that based on information available to us,
          Polkadot-js extension believes this domain could currently compromise your security and, as an added safety feature, Polkadot-js extension
          has restricted access to the site. To override this, please read the rest of this warning for instructions on how to continue at your own risk.`)}
      </Note>
      <Note>
        {t<string>(`
          Domains on these warning lists may include outright malicious websites and legitimate websites that have been compromised by a malicious actor.
      `)}
      </Note>
      <Note>
        {t<string>(`
          Note that this warning list is compiled on a voluntary basis. This list may be inaccurate or incomplete.
          Just because a domain does not appear on this list is not an implicit guarantee of that domain's safety.
          As always, your transactions are your own responsibility.
      `)}
      </Note>
      <Note>
        {t<string>(`
          If you think this domain is incorrectly flagged or if a blocked legitimate website has resolved its security issues,
      `)}
        <IssueLink
          href='https://github.com/polkadot-js/phishing/issues/new'
        >
          {t<string>('please file an issue')}
        </IssueLink>.
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
