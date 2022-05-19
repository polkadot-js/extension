// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import cloneIconLight from '@subwallet/extension-koni-ui/assets/clone--color-2.svg';
import cloneIconDark from '@subwallet/extension-koni-ui/assets/clone--color-3.svg';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled, { ThemeContext } from 'styled-components';

import Labelled from './Labelled';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  help?: React.ReactNode;
  isDisabled?: boolean;
  isError?: boolean;
  isFull?: boolean;
  isHidden?: boolean;
  isMonospace?: boolean;
  isSmall?: boolean;
  isTrimmed?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  value?: string;
  withCopy?: boolean;
  withLabel?: boolean;
}

function Output ({ children, className = '', help, isDisabled, isError, isFull, isHidden, isMonospace, isSmall, isTrimmed, label, labelExtra, value, withCopy = false, withLabel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const theme = themeContext.id;

  const { show } = useToast();

  const _onCopy = useCallback(
    () => {
      show(t('Copied'));
    },
    [show, t]
  );

  return (
    <Labelled
      className={className}
      help={help}
      isFull={isFull}
      isHidden={isHidden}
      isSmall={isSmall}
      label={label}
      labelExtra={labelExtra}
      withLabel={withLabel}
    >
      <div className={`ui--output ui dropdown selection ${isError ? ' error' : ''}${isMonospace ? ' monospace' : ''}${isDisabled ? ' disabled' : ''}`}>
        {isTrimmed && value && (value.length > 256)
          ? `${value.substr(0, 96)}…${value.substr(-96)}`
          : value
        }
        {children}
      </div>

      <CopyToClipboard text={(value && value) || ''}>
        <div
          className={'kn-copy-btn'}
          onClick={_onCopy}
        >
          {theme === 'dark'
            ? (
              <img
                alt='copy'
                src={cloneIconDark}
              />
            )
            : (
              <img
                alt='copy'
                src={cloneIconLight}
              />
            )
          }
        </div>
      </CopyToClipboard>
    </Labelled>
  );
}

export default React.memo(styled(Output)(({ theme }: ThemeProps) => `
  border: 2px dashed ${theme.boxBorderColor};
  border-radius: 8px;
  padding: 8px 90px 8px 10px;
  position: relative;
  font-size: 15px;

  > label {
    color: ${theme.textColor2};
  }

  .kn-copy-btn {
    width: 48px;
    height: 48px;
    position: absolute;
    top: 0;
    right: 10px;
    bottom: 0;
    margin-top: auto;
    margin-bottom: auto;
    cursor: pointer;
    background-color: ${theme.buttonBackground1};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 40%;
  }

  .ui--output {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    color: ${theme.textColor};
  }
`));
