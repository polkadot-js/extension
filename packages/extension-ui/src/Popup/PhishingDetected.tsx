// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { Trans } from 'react-i18next';
import { useParams } from 'react-router';

import { useTranslation } from '../hooks/index.js';
import { Header } from '../partials/index.js';
import { styled } from '../styled.js';

interface Props {
  className?: string;
}

interface WebsiteState {
  website: string;
}

function PhishingDetected ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { website } = useParams<WebsiteState>();
  const decodedWebsite = decodeURIComponent(website);

  return (
    <>
      <Header text={t('Phishing detected')} />
      <div className={className}>
        <p>
          {t('You have been redirected because the Polkadot Developer Signer believes that this website could compromise the security of your accounts and your tokens.')}
        </p>
        <p className='websiteAddress'>
          {decodedWebsite}
        </p>
        <p>
          <Trans i18nKey='phishing.incorrect'>
            Note that this  website was reported on a community-driven, curated list. It might be incomplete or inaccurate. If you think that this website was flagged incorrectly, <a href='https://github.com/polkadot-js/phishing/issues/new'>please open an issue by clicking here</a>.
          </Trans>
        </p>
      </div>
    </>
  );
}

export default styled(PhishingDetected)<Props>`
  p {
    color: var(--subTextColor);
    margin-bottom: 1rem;
    margin-top: 0;

    a {
      color: var(--subTextColor);
    }

    &.websiteAddress {
      font-size: 1.3rem;
      text-align: center;
    }
  }
`;
