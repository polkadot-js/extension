// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { InputWithLabel, Svg, ValidatedInput } from '../components';
import { validateDerivationPath } from '../messaging';
import { Result } from '../validators';
import arrowIcon from '../assets/arrow-down.svg';
import gearIcon from '../assets/gear.svg';

interface Props {
  className?: string;
  onChange: (derivedAccount: { address: string; suri: string } | null) => void;
  parentAddress: string;
  parentPassword: string;
  defaultPath: string;
}

function DerivationPath ({ className, defaultPath, onChange, parentAddress, parentPassword }: Props): React.ReactElement<Props> {
  const [path, setPath] = useState<string>(defaultPath);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const isPathValid = useCallback(async (newPath: string): Promise<Result<string>> => {
    try {
      await validateDerivationPath(parentAddress, newPath, parentPassword);

      return Result.ok(newPath);
    } catch (error) {
      return Result.error(newPath === path ? '' : 'Invalid derivation path');
    }
  }, [path, parentAddress, parentPassword]);

  const _onExpand = useCallback(() => setShowAdvancedOptions(!showAdvancedOptions), [showAdvancedOptions]);

  const _onChange = useCallback(async (newPath: string | null) => {
    newPath !== null && setPath(newPath);
    onChange(newPath === null ? null : await validateDerivationPath(parentAddress, newPath, parentPassword));
  }, [parentAddress, onChange, parentPassword]);

  return (
    <div className={className}>
      <OptionsLabel onClick={_onExpand}>
        <LabelWithIcon>
          <GearIcon/>
          <label>Advanced derivation options</label>
        </LabelWithIcon>
        <ArrowIcon isExpanded={showAdvancedOptions}/>
      </OptionsLabel>
      <Expandable isExpanded={showAdvancedOptions}>
        <ValidatedInput
          component={InputWithLabel}
          data-input-suri
          defaultValue={defaultPath}
          label='Derivation path'
          onValidatedChange={_onChange}
          placeholder='//hard/soft'
          validator={isPathValid}
          value={path}
        />
      </Expandable>
    </div>
  );
}

interface ExpandableComponentProps {
  isExpanded: boolean;
}

const ArrowIcon = styled(Svg).attrs(() => ({
  src: arrowIcon
}))<ExpandableComponentProps>`
  height: 6px;
  width: 8px;
  margin-right: 6px;
  align-self: center;
  background: ${({ theme }): string => theme.subTextColor};
  transform: ${({ isExpanded }): string => `rotate(${isExpanded ? '0' : '-90'}deg)`};
  transition: 0.1s;
`;

const LabelWithIcon = styled.div`
  display: flex;
  flex-direction: row;
  user-select: none;
`;

const GearIcon = styled(Svg).attrs(() => ({
  src: gearIcon
}))`
  height: 12px;
  width: 12px;
  margin-right: 6px;
  align-self: center;
  background: ${({ theme }): string => theme.subTextColor};
`;

export const OptionsLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  &:hover {
    cursor: pointer;
    color: ${({ theme }): string => `${theme.subTextColor}`};
  }
  label{
    font-size: 10px;
    margin-top: 1px;
    line-height: 10px;
    letter-spacing: 0.04em;
    font-weight: 800;
    opacity: 0.65;
    text-transform: uppercase;
    &:hover {
      cursor: pointer;
      color: ${({ theme }): string => `${theme.subTextColor}`};
    }
  }
`;

const Expandable = styled.div<ExpandableComponentProps>`
  visibility: ${({ isExpanded }): string => isExpanded ? 'visible' : 'hidden'};
`;

export default styled(DerivationPath)`
  border-top: ${({ theme }): string => `1px solid ${theme.inputBorderColor}`};
  padding-top: 10px;
`;
