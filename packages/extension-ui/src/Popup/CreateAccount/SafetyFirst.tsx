// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import helpIcon from '../../assets/help.svg';
import lockIcon from '../../assets/locked.svg';
import { ActionContext, Button, ButtonArea, Svg, VerticalSpace } from '../../components';
import HelperFooter from '../../components/HelperFooter';
import useTranslation from '../../hooks/useTranslation';

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

function SafetyFirst({ className, onNextStep }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const footer = (
    <HelperFooter>
      <WrapperRow>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('Why it is critical to store your secret\nphrase in a safe place?')}&nbsp;
          <span className='link'>{t<string>('Learn more')}</span>
        </span>
      </WrapperRow>
    </HelperFooter>
  );

  return (
    <>
      <div className={className}>
        <div className='top'>
          <img
            className='icon'
            src={lockIcon}
          />
          <p className='heading'>{t<string>('Safety first!')}</p>
          <p className='description'>
            {t<string>(
              "In the next step, you'll generate a secret phrase that allows you to access your account. Anyone who manages to access it will have a full control over your account,\nso read, save, and store it safely."
            )}
          </p>
        </div>
      </div>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          onClick={goTo('/')}
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
        
      .icon {
        margin: 0 auto;
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
