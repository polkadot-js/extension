// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect, useRef } from 'react';
import gearIcon from '../assets/gear.svg';
import arrowIcon from '../assets/arrow-down.svg';
import styled from 'styled-components';
import { KeypairType } from '@polkadot/util-crypto/types';
import { Dropdown, InputWithLabel, Svg } from '@polkadot/extension-ui/components';
import { validateSeed } from '@polkadot/extension-ui/messaging';

export type OnDerivationPathChangeProps = {
  isValid: true;
  suri: string;
  address: string;
  keyPairType?: KeypairType;
} | {
  isValid: false;
  suri: string;
  error: string;
}

interface Props {
  onChange: (derivationPath: OnDerivationPathChangeProps) => void;
  seed: string;
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

function DerivationPath ({ onChange, seed }: Props): React.ReactElement<Props> {
  const [type, setType] = useState<KeypairType | undefined>(undefined);
  const [path, setPath] = useState('');
  const [isValid, setValid] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const getSuri = (): string => (path ? `${seed}${path}` : seed);

  const ref = useRef<HTMLDivElement>(null);

  const scrollToBottom = (reverse: boolean): void => {
    ref && ref.current && ref.current.scrollTo({
      top: reverse ? -100000000 : 100000000, // a sufficiently large number
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const suri = getSuri();
    (async (): Promise<void> => {
      try {
        const { address } = await validateSeed(suri, type);
        onChange({
          isValid: true,
          address,
          suri,
          keyPairType: type
        });
        setValid(true);
      } catch (error) {
        onChange({
          isValid: false,
          suri,
          error: error.message
        });
        setValid(false);
      }
    })();
  }, [type, path]);

  return (
    <DerivationPathContainer>
      <>
        <OptionsLabel
          onClick={(): void => {
            if (!type) {
              setType('sr25519');
            }
            if (showAdvancedOptions) {
              scrollToBottom(true);
              setTimeout(() => setShowAdvancedOptions(false), 200);
            } else {
              setShowAdvancedOptions(true);
              setTimeout(() => scrollToBottom(false), 100);
            }
          }}
        >
          <LabelWithIcon>
            <GearIcon/>
            <label>Advanced creation options</label>
          </LabelWithIcon>
          <ArrowIcon isExpanded={showAdvancedOptions}/>
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
              label='Derivation path'
              placeholder={type ? keypairs[type].placeholder : ''}
              onChange={setPath}
              value={path}
              isError={!isValid}
            />
          </>
        )}
        <div ref={ref} />
      </>
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

const LabelWithIcon = styled.div`
  display: flex;
  flex-direction: row;
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

export default DerivationPath;
