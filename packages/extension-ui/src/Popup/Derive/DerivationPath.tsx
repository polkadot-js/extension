// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../../types';

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import lockIcon from '../../assets/lock.svg';
import unlockIcon from '../../assets/unlock.svg';
import { InputWithLabel, Svg, Button } from '../../components';

interface Props {
  className?: string;
  defaultPath: string;
  isError: boolean;
  onChange: (suri: string) => void;
  parentAddress: string;
  parentPassword: string;
}

function DerivationPath ({ className, defaultPath, isError, onChange }: Props): React.ReactElement<Props> {
  const [path, setPath] = useState<string>(defaultPath);
  const [isDisabled, setIsDisabled] = useState(false);
  const _onExpand = useCallback(() => setIsDisabled(!isDisabled), [isDisabled]);

  const _onChange = useCallback((newPath: string): void => {
    setPath(newPath);
    onChange(newPath);
  }, [onChange]);

  return (
    <div className={className}>
      <div className='container'>
        <PathInput isUnlocked={isDisabled}>
          <InputWithLabel
            data-input-suri
            disabled={!isDisabled}
            isError={isError || !path}
            label={
              isDisabled
                ? 'Derivation Path'
                : 'Derivation Path (unlock to edit)'
            }
            onChange={_onChange}
            placeholder='//hard/soft'
            value={path}
          />
        </PathInput>
        <LockButton onClick={_onExpand}>
          {!isDisabled ? <LockIcon/> : <UnlockIcon/>}
        </LockButton>
      </div>
    </div>
  );
}

interface UnlockableComponentProps {
  isUnlocked: boolean;
}

const PathInput = styled.div<UnlockableComponentProps>`
  width: 100%;

  & input {
    opacity: ${({ isUnlocked }): string => isUnlocked ? '100' : '50'}%;
  }
`;

const LockIcon = styled(Svg).attrs(() => ({ src: lockIcon }))`
  width: 11px;
  height: 14px;
  background: ${({ theme }: ThemeProps) => theme.iconNeutralColor};
`;

const UnlockIcon = styled(Svg).attrs(() => ({ src: unlockIcon }))`
  width: 11px;
  height: 14px;
  background: ${({ theme }: ThemeProps) => theme.iconNeutralColor};
`;

const LockButton = styled(Button)`
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
`;

export default React.memo(styled(DerivationPath)`
  > .container {
    display: flex;
    flex-direction: row;
  }
`);
