// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { InputWithLabel, Svg, ValidatedInput, Button } from '../components';
import { validateDerivationPath } from '../messaging';
import { Result } from '../validators';
import lockIcon from '../assets/lock.svg';
import unlockIcon from '../assets/unlock.svg';

interface Props {
  className?: string;
  onChange: (derivedAccount: { address: string; suri: string } | null) => void;
  parentAddress: string;
  parentPassword: string;
  defaultPath: string;
}

function DerivationPath ({ className, defaultPath, onChange, parentAddress, parentPassword }: Props): React.ReactElement<Props> {
  const [path, setPath] = useState<string>(defaultPath);
  const [isDisabled, setIsDisabled] = useState(false);

  const isPathValid = useCallback(async (newPath: string): Promise<Result<string>> => {
    try {
      await validateDerivationPath(parentAddress, newPath, parentPassword);

      return Result.ok(newPath);
    } catch (error) {
      return Result.error(newPath === path ? '' : 'Invalid derivation path');
    }
  }, [path, parentAddress, parentPassword]);

  const _onExpand = useCallback(() => setIsDisabled(!isDisabled), [isDisabled]);

  const _onChange = useCallback(async (newPath: string | null) => {
    newPath !== null && setPath(newPath);
    onChange(newPath === null ? null : await validateDerivationPath(parentAddress, newPath, parentPassword));
  }, [parentAddress, onChange, parentPassword]);

  return (
    <div className={className}>
      <PathField>
        <PathInput isUnlocked={isDisabled}>
          <ValidatedInput
            component={InputWithLabel}
            data-input-suri
            defaultValue={defaultPath}
            disabled={!isDisabled}
            label={
              isDisabled
                ? 'Derivation Path'
                : 'Derivation Path (unlock to edit)'
            }
            onValidatedChange={_onChange}
            placeholder='//hard/soft'
            validator={isPathValid}
            value={path}
          />
        </PathInput>
        <LockButton onClick={_onExpand}>
          {!isDisabled ? <LockIcon/> : <UnlockIcon/>}
        </LockButton>
      </PathField>
    </div>
  );
}

const PathField = styled.div`
  display: flex;
  flex-direction: row;
`;

interface UnlockableComponentProps {
  isUnlocked: boolean;
}

const PathInput = styled.div<UnlockableComponentProps>`
  width: 100%;

  & input {
    opacity: ${({ isUnlocked }): string => isUnlocked ? '100' : '50'}%;
  }
`;

const LockIcon = styled(Svg).attrs(() => ({
  src: lockIcon
}))`
  width: 11px;
  height: 14px;
  background: ${({ theme }): string => theme.iconNeutralColor};
`;

const UnlockIcon = styled(Svg).attrs(() => ({
  src: unlockIcon
}))`
  width: 11px;
  height: 14px;
  background: ${({ theme }): string => theme.iconNeutralColor};
`;

const LockButton = styled(Button)`
  width: 11px;
  height: 14px;
  padding: 3px;
  margin: 36px 2px 0 10px;
  background: none;
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

export default DerivationPath;
