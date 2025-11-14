// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext } from 'react';

import { ActionContext, Box, Button, ButtonArea, List } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { Header } from '../partials/index.js';
import { styled } from '../styled.js';

interface Props {
  className?: string;
}

function AssetHubMigration ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback(
    (): void => {
      window.localStorage.setItem('asset_hub_migration_read', 'ok');
      onAction();
    },
    [onAction]
  );

  return (
    <>
      <Header text={t('Asset Hub Migration Notice')} />
      <div className={className}>
        <p>{t('The Asset Hub migration has been completed. Please note the following important changes:')}</p>
        <Box>
          <List>
            <li>{t('All balances have been migrated from the Relay Chain to Asset Hub')}</li>
            <li>{t('All on-chain functionality has been moved to Asset Hub')}</li>
            <li>{t('Asset Hub now holds user balances and provides general functionality')}</li>
          </List>
        </Box>
        <p className='warning'>{t('Do not teleport balances to the Relay Chain unless:')}</p>
        <Box>
          <List>
            <li>{t('You are opening HRMP channels, or')}</li>
            <li>{t('You are starting a Parachain')}</li>
          </List>
        </Box>
        <p>{t('For all other operations, your balances are already on Asset Hub.')}</p>
      </div>
      <ButtonArea>
        <Button onClick={_onClick}>{t('I Understand')}</Button>
      </ButtonArea>
    </>
  );
}

export default styled(AssetHubMigration)<Props>`
  p {
    color: var(--subTextColor);
    margin-bottom: 4px;
    margin-top: 0;
    line-height: 1.4;
  }

  p.warning {
    color: var(--errorColor);
    font-weight: 600;
    font-size: 1.1em;
    margin-top: 6px;
    margin-bottom: 2px;
    text-transform: uppercase;
    line-height: 1.3;
  }

  article {
    margin: 0.4rem 24px;
    padding: 8px 20px;
  }

  ul {
    margin: 0;
  }
`;
