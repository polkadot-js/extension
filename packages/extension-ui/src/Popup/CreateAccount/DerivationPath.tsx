// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';
import gearIcon from '../../assets/gear.svg';
import arrowIcon from '../../assets/arrow-down.svg';
import styled from 'styled-components';
import { KeypairType } from '@polkadot/util-crypto/types';
import { Dropdown, InputWithLabel, Svg } from '@polkadot/extension-ui/components';

interface Props {
  onChange: (derivationPath: {
    pairType: KeypairType;
    path: string;
  }) => void;
  onExpand: (reverse: boolean) => void;
  isValid: boolean;
}

const keypairs = {
  ed25519: {
    name: 'Edwards (ed25519)',
    placeholder: '//hard///password'
  },
  sr25519: {
    name: 'Schnorrkel (sr25519)',
    placeholder: '//hard/soft///password'
  }
};

function DerivationPath ({ onChange, isValid, onExpand }: Props): React.ReactElement<Props> {
  const [type, setType] = useState<KeypairType>('ed25519');
  const [path, setPath] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    onChange({
      pairType: type,
      path
    });
  }, [type, path]);

  return (
    <DerivationPathContainer>
      <OptionsLabel
        onClick={(): void => {
          if (showAdvancedOptions) {
            onExpand(true);
            setTimeout(() => setShowAdvancedOptions(false), 200);
          } else {
            setShowAdvancedOptions(true);
            setTimeout(() => onExpand(false), 100);
          }
        }}
      >
        <ArrowIcon isExpanded={showAdvancedOptions}/>
        <label>Advanced creation options</label>
        <GearIcon/>
      </OptionsLabel>
      {showAdvancedOptions && (
        <>
          <KeyPairDropdown
            label='keypair crypto type'
            options={Object.entries(keypairs).map(([key, { name }]) => ({
              text: name,
              value: key
            }))}
            onChange={(value): void => setType(value as KeypairType)}
            value={type}
          />
          <InputWithLabel
            label='Advanced creation options'
            placeholder={keypairs[type].placeholder}
            onChange={setPath}
            value={path}
            isError={!isValid}
          />
        </>
      )}
    </DerivationPathContainer>
  );
}

const DerivationPathContainer = styled.div`
  border-top: ${({ theme }): string => `1px solid ${theme.inputBorderColor}`};
  padding-top: 10px;
`;

const KeyPairDropdown = styled(Dropdown)`
  margin-bottom: 16px;
`;

interface ArrowIconProps {
  isExpanded: boolean;
}

const ArrowIcon = styled(Svg).attrs(() => ({
  src: arrowIcon
}))<ArrowIconProps>`
  height: 6px;
  width: 8px;
  margin-right: 6px;
  align-self: center;
  background: ${({ theme }): string => theme.subTextColor};
  transform: ${({ isExpanded }): string => `rotate(${isExpanded ? '0' : '-90'}deg)`};
  transition: 0.1s;
`;

const GearIcon = styled(Svg).attrs(() => ({
  src: gearIcon
}))`
  height: 12px;
  width: 12px;
  margin-left: 6px;
  align-self: center;
  background: ${({ theme }): string => theme.subTextColor};
`;

export const OptionsLabel = styled.div`
  display: flex;
  justify-content: flex-start;
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

export default DerivationPath;
