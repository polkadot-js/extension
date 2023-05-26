// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { InputLock, InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  defaultPath: string;
  isError: boolean;
  onChange: (suri: string) => void;
  parentAddress: string;
  parentPassword: string;
  withSoftPath: boolean;
}

interface StyledInputWithLabelProps extends ThemeProps {
  isLocked: boolean;
}

const StyledInputWithLabel = styled(InputWithLabel)`
  max-width: 284px;
  gap: 4px;
  position: relative;
  &:disabled {
    color: ${({ theme }: StyledInputWithLabelProps) => theme.disabledTextColor};
  }

  label {
    color: ${({ isLocked, theme }: StyledInputWithLabelProps) =>
      isLocked ? theme.disabledTextColor : theme.subTextColor};
    opacity: 1;
  }
`;

function DerivationPath({ className, defaultPath, isError, onChange, withSoftPath }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [path, setPath] = useState<string>(defaultPath);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    setPath(defaultPath);
  }, [defaultPath]);

  const _onChange = useCallback(
    (newPath: string): void => {
      setPath(newPath);
      onChange(newPath);
    },
    [onChange]
  );

  const _toggleLocked = useCallback(() => {
    setIsDisabled((prevState) => !prevState);
  }, []);

  return (
    <div className={className}>
      <div className='container'>
        <div className={`pathInput ${isDisabled ? 'locked' : ''} input-with-lock`}>
          <StyledInputWithLabel
            className='derivationPath'
            data-input-suri
            disabled={isDisabled}
            isError={isError || !path}
            isFocused
            isLocked={isDisabled}
            label={t<string>('Sub-account derivation path')}
            onChange={_onChange}
            placeholder={withSoftPath ? t<string>('//hard/soft') : t<string>('//hard')}
            value={path || ''}
          />
          <InputLock
            isLocked={isDisabled}
            onClick={_toggleLocked}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(
  styled(DerivationPath)(
    ({ theme }: Props) => `
  > .container {
    display: flex;
    flex-direction: row;
  }

  .lockButton {
    background: none;
    height: 14px;
    margin: 36px 2px 0 10px;
    padding: 3px;
    width: 11px;

    &:not(:disabled):hover {
      background: none;
    }

    &:active, &:focus {
      outline: none;
    }

    &::-moz-focus-inner {
      border: 0;
    }
  }

  .lockIcon {
    color: ${theme.iconNeutralColor}
  }

  .pathInput {
    width: 100%;

    &.locked input {
      color: ${theme.disabledTextColor};
    }
  }

  .unlock-text {
    padding-left: 16px;
    color: ${theme.disabledTextColor};
    opacity: 0.65;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
  }

  .input-with-lock {
    display: flex;
    gap: 4px;
  }
`
  )
);
