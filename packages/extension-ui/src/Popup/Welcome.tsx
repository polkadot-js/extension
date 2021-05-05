// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { ActionContext, Box, Button, ButtonArea, List, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { Header } from '../partials';

interface Props extends ThemeProps {
  className?: string;
}

const Welcome = function ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = (): void => {
    window.localStorage.setItem('welcome_read', 'ok');
    onAction();
  };

  return (
    <>
      <Header text={t<string>('Welcome')} />
      <div className={className}>
        <p>{t<string>('Before we start, just a couple of notes regarding use:')}</p>
        <Box>
          <List>
            <li>{t<string>('We do not send any clicks, pageviews or events to a central server')}</li>
            <li>{t<string>('We do not use any trackers or analytics')}</li>
            <li>{t<string>("We don't collect keys, addresses or any information - your information never leaves this machine")}</li>
          </List>
        </Box>
        <p>{t<string>('... we are not in the information collection business (even anonymized).')}</p>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button onClick={_onClick}>{t<string>('Understood, let me continue')}</Button>
      </ButtonArea>
    </>
  );
};

export default styled(Welcome)(({ theme }: Props) => `
  p {
    color: ${theme.subTextColor};
    margin-bottom: 6px;
    margin-top: 0;
  }
`);
