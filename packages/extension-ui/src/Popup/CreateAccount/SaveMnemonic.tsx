// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

import copyIcon from '../../assets/copy.svg';
import { BackButton, Button, ButtonArea, MnemonicPill, Svg, VerticalSpace } from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  onPreviousStep: () => void;
  onNextStep: () => void;
  seed: string;
}

function SaveMnemonic({ className, onNextStep, onPreviousStep, seed }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const seedArray = seed.split(' ');

  const _onCopy = useCallback(() => show(t('Secret phrase copied to clipboard'), 'success'), [show, t]);

  return (
    <>
      <div className={className}>
        <div className='text'>
          <span className='heading'>{t<string>('Save your secret phrase')}</span>
          <span className='subtitle'>
            {t<string>('Remember to save your secret phrase\nand')}
            <span className='bold'>{t<string>(' keep it safe!')}</span>
          </span>
        </div>
        <div className='mnemonic-container'>
          {seedArray.map((word, index) => (
            <MnemonicPill
              className='mnemonic-pill'
              index={index + 1}
              key={index + 1}
              name={`mnemonic-${index}`}
              word={word}
            />
          ))}
        </div>
        <CopyToClipboard text={seed}>
          <Button
            className='copy-button'
            onClick={_onCopy}
            tertiary
          >
            <div className='copy-to-clipboard'>
              <Svg
                className='copyIcon'
                src={copyIcon}
              />
              {t<string>('Copy to clipboard')}
            </div>
          </Button>
        </CopyToClipboard>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onPreviousStep} />
        <Button onClick={onNextStep}>{t<string>('Next')}</Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(
  styled(SaveMnemonic)(
    ({ theme }: Props) => `
    display: flex;
    flex-direction: column;
    gap: 48px;


    .copyIcon {
      width: 16px;
      height: 16px;
      background: ${theme.primaryColor};
    }

    .text {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 32px;
      gap: 8px;
      
      .heading {
        font-family: ${theme.secondaryFontFamily};
        color: ${theme.textColor};
        font-weight: 500;
        font-size: 16px;
        line-height: 125%;
        text-align: center;
        letter-spacing: 0.06em;
        }

      .subtitle {
        color: ${theme.subTextColor};
        font-size: 14px;
        line-height: 145%;
        text-align: center;
        letter-spacing: 0.07em;
        white-space: pre-line;
        
        & .bold {
          color: ${theme.subTextColor};
          font-weight: 600;
        }
      }
    }
    
    .mnemonic-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
      width: 100%;
      user-select: all;

      .mnemonic-index {
        user-select: none;
      }
    }

    .mnemonic-pill {
      box-sizing: border-box;
      width: 108px;
      margin-bottom: 8px;
      input {
        text-align: left;
      }
    }

    .copy-to-clipboard {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;

      :hover {
        ${Svg} {
          background: ${theme.buttonBackgroundHover};
        }
      }
    }
    .copy-button {
      margin: 0 auto;
    }
`
  )
);
