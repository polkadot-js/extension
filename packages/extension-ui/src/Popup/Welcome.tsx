// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import secureIMG from '../assets/secure.png';
import { ActionContext, Button, ButtonArea, List, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';

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
          className='centered'
          src={secureIMG}
        />
        <p className='heading'>{t<string>('Your privacy is protected')}</p>
        <List>
          <li>{t<string>('Aleph Zero Signer does not send any clicks, pageviews, and events to external servers')}</li>
          <li>{t<string>('Aleph Zero Signer does not use any analytics')}</li>
          <li>
            {t<string>(
              'All your data stays on this device:\nyour secret phrases, addresses, and\nany other information are only stored locally'
            )}
          </li>
        </List>
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
`
);
