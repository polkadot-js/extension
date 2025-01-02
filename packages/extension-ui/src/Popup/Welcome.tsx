// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext } from 'react';

import { ActionContext, Box, Button, ButtonArea, List, VerticalSpace } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { Header } from '../partials/index.js';
import { styled } from '../styled.js';

interface Props {
  className?: string;
}

function Welcome ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback(
    (): void => {
      window.localStorage.setItem('welcome_read', 'ok');
      onAction();
    },
    [onAction]
  );

  return (
    <>
      <Header text={t('Welcome')} />
      <div className={className}>
        <p>{t('Before we start, just a couple of notes regarding use:')}</p>
        <Box>
          <List>
            <li>{t('We do not send any clicks, pageviews or events to a central server')}</li>
            <li>{t('We do not use any trackers or analytics')}</li>
            <li>{t("We don't collect keys, addresses or any information - your information never leaves this machine")}</li>
          </List>
        </Box>
        <p>{t('... we are not in the information collection business (even anonymized).')}</p>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button onClick={_onClick}>{t('Understood, let me continue')}</Button>
      </ButtonArea>
    </>
  );
}

export default styled(Welcome)<Props>`
  p {
    color: var(--subTextColor);
    margin-bottom: 6px;
    margin-top: 0;
  }
`;
