// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Button, InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps{
  className?: string;
  defaultPath: string;
  isError: boolean;
  onChange: (suri: string) => void;
  parentAddress: string;
  parentPassword: string;
  withSoftPath: boolean;
}

function DerivationPath ({ className, defaultPath, isError, onChange, withSoftPath }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [path, setPath] = useState<string>(defaultPath);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    setPath(defaultPath);
  }, [defaultPath]);

  const _onExpand = useCallback(() => setIsDisabled(!isDisabled), [isDisabled]);

  const _onChange = useCallback((newPath: string): void => {
    setPath(newPath);
    onChange(newPath);
  }, [onChange]);

  return (
    <div className={className}>
      <div className='container'>
        <div className={`pathInput ${isDisabled ? 'locked' : ''}`}>
          <InputWithLabel
            data-input-suri
            disabled={isDisabled}
            isError={isError || !path}
            label={
              isDisabled
                ? t('Derivation Path (unlock to edit)')
                : t('Derivation Path')
            }
            onChange={_onChange}
            placeholder={withSoftPath
              ? t<string>('//hard/soft')
              : t<string>('//hard')
            }
            value={path}
          />
        </div>
        <Button
          className='lockButton'
          onClick={_onExpand}
        >
          <FontAwesomeIcon
            className='lockIcon'
            icon={isDisabled ? faLock : faLockOpen}
          />
        </Button>
      </div>
    </div>
  );
}

export default React.memo(styled(DerivationPath)(({ theme }: Props) => `
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
      opacity: 50%;
    }
  }
`));
