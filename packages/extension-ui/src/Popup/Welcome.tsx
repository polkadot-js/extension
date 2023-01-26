// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import secureIMG from '../assets/secure.png';
import { ActionContext, Button, ButtonArea, List } from '../components';
import useTranslation from '../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
}

const Welcome = function ({ className }: Props): React.ReactElement<Props> {
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
      <div className={className}>
        <img
          className='centered'
          src={secureIMG}
        />
        <p className='heading'>{t<string>('Your privacy is protected')}</p>
        <List>
          <li>{t<string>('We do NOT send any clicks, pageviews or events to a central server')}</li>
          <li>{t<string>('We do NOT use any trackers or analytics')}</li>
          <li>{t<string>('We do NOT collect keys, addresses or any information - your information never leaves this machine')}</li>
          <li>{t<string>('We are NOT in the information collection business (even anonymized).')}</li>
        </List>

      </div>
      <ButtonArea>
        <Button onClick={_onClick}>{t<string>('Got it!')}</Button>
      </ButtonArea>
    </>
  );
};

export default styled(Welcome)(({ theme }: Props) => `
  .centered {
    justify-content: center;
    display: flex;
    margin: 24px auto;
  }
  
  .heading {
    font-family: ${theme.secondaryFontFamily};
    font-weight: 700;
    font-size: 20px;
    line-height: 120%;
    text-align: center;
    letter-spacing: 0.035em;
    color: ${theme.textColor};
  }
`);
