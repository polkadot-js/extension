// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import animatedLockIcon from '../../assets/anim_locked.svg';
import helpIcon from '../../assets/help.svg';
import { AnimatedSvg, Button, ButtonArea, HelperFooter, LearnMore, Svg, VerticalSpace } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';

interface Props extends ThemeProps {
  className?: string;
  onNextStep: () => void;
}

const WrapperRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
`;

const StyledFooter = styled(HelperFooter)`
  .icon {
    margin-bottom: 10px;
  }
`;

function SafetyFirst({ className, onNextStep }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const footer = (
    <StyledFooter>
      <WrapperRow>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('Why it is critical to store your secret\nphrase in a safe place?')}&nbsp;
          <LearnMore href={LINKS.SAFETY} />
        </span>
      </WrapperRow>
    </StyledFooter>
  );

  return (
    <>
      <div className={className}>
        <div className='top'>
          <AnimatedSvg
            className='icon'
            src={animatedLockIcon}
          />
          <span className='heading'>{t<string>('Safety first!')}</span>
          <span className='description'>
            {t<string>(
              "In the next step, you'll generate a secret phrase that allows you to access your account. Anyone who manages to access it will have a full control over your account,\nso read, save, and store it safely."
            )}
          </span>
        </div>
      </div>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          onClick={window.close}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button onClick={onNextStep}>{t<string>('Next')}</Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(
  styled(SafetyFirst)(
    ({ theme }: Props) => `
    display: flex;
    flex-direction: column;

    .top {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 54px;
      gap: 16px;
        
      .icon {
        margin: 0 auto;
        width: 96px;
        height: 96px;
        // background: ${theme.warningColor};
      }

      .heading {
        font-family: ${theme.secondaryFontFamily};
        color: ${theme.textColor};
        font-weight: 700;
        font-size: 20px;
        line-height: 120%;
        text-align: center;
        letter-spacing: 0.035em;
        }
      }

    .description {
      color: ${theme.subTextColor};
      font-weight: 300;
      font-size: 14px;
      line-height: 145%;
      text-align: center;
      letter-spacing: 0.07em;
      white-space: pre-line;
    }
`
  )
);
