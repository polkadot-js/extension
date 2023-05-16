// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { t } from 'i18next';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import { deleteAuthRequest } from '@polkadot/extension-ui/messaging';

import animatedWarning from '../../assets/anim_warning.svg';
import border from '../../assets/border.svg';
import helpIcon from '../../assets/help.svg';
import { AnimatedSvg, Button, ButtonArea, HelperFooter, LearnMore, Link, Svg, VerticalSpace } from '../../components';
import { LINKS } from '../../links';
import { Z_INDEX } from '../../zindex';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
}

const CustomButtonArea = styled(ButtonArea)`
  padding: 0px 24px;
  margin-top: 96px;
  margin-bottom: 0px;
`;

const CustomFooter = styled(HelperFooter)`
  flex-direction: row;
  display: flex;
  gap: 8px;

  .text-container {
    display: flex;
    gap: 4px;
  }

  .group {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    margin-left: -32px;
  }
`;

function NoAccount({ authId, className }: Props): React.ReactElement<Props> {
  const _onClick = useCallback(async () => {
    try {
      await deleteAuthRequest(authId);
      window.close();
    } catch (error) {
      console.error(error);
    }
  }, [authId]);

  const footer = (
    <CustomFooter>
      <div className='group'>
        <div className='icon-container'>
          <Svg
            className='icon'
            src={helpIcon}
          />
        </div>
        <div className='text-container'>
          <span>
            {t<string>('Only connect with sites you trust.')}&nbsp;
            <br />
            <LearnMore href={LINKS.TRUSTED_APPS} />
          </span>
        </div>
      </div>
    </CustomFooter>
  );

  return (
    <>
      <div className={className}>
        <div className='content-inner'>
          <Svg
            className='border'
            src={border}
          />
          <AnimatedSvg
            className='warning-icon'
            src={animatedWarning}
          />
          <span className='heading'>{t<string>('You do NOT have any account')}</span>
          <span className='subtitle'>
            {t<string>('Please')}&nbsp;
            <Link
              className='link'
              to='/account/add-menu'
            >
              {t<string>('create an account')}
            </Link>
            &nbsp;
            {t<string>("and refresh the application's page.")}&nbsp;
          </span>
        </div>
      </div>
      <VerticalSpace />
      <CustomButtonArea footer={footer}>
        <Button
          className='acceptButton'
          onClick={_onClick}
          secondary
        >
          {t<string>('Got it!')}
        </Button>
      </CustomButtonArea>
    </>
  );
}

export default styled(NoAccount)(
  ({ theme }: Props) => `
  overflow: hidden
  .acceptButton {
    width: 90%;
    margin: 25px auto 0;
  }

  body {    
    height: 600px;
  }

  .border {
    z-index: ${Z_INDEX.BORDER};
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
    background: ${theme.warningColor};
    height: 600px;
    width: 360px;
  }

  .warning-icon {
    width: 96px;
    height: 96px;
  }

  .content-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-top: 110px;
  }

  .heading {
    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 700;
    font-size: 24px;
    line-height: 118%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.03em;
    color: ${theme.textColor};
    margin: 16px 0px 8px 0px;
    text-align: center;
    white-space: pre-line;
  }

  ${Link} {
    display: inline;
    vertical-align: baseline;
  }

  .subtitle {
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: center;
    letter-spacing: 0.07em;
    white-space: pre-line;
    color: ${theme.subTextColor};
    
    .link {
      color: ${theme.primaryColor};
      cursor: pointer;

      :hover {
        text-decoration: underline;
      }
    }
  }
`
);
