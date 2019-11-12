// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled from 'styled-components';
import React, { MouseEventHandler } from 'react';
import TextAreaWithLabel from './TextAreaWithLabel';
import ActionText from '@polkadot/extension-ui/components/ActionText';
import copy from '../assets/copy.svg';
import print from '../assets/print.svg';

const MnemonicText = styled(TextAreaWithLabel).attrs(() => ({
  label: 'Generated 12-word mnemonic seed:',
  isReadOnly: true
}))`  
  textarea {
    font-weight: 600;
    font-size: ${({ theme }): string => theme.fontSize};
    line-height: ${({ theme }): string => theme.lineHeight};
    letter-spacing: -0.01em;
    padding: 14px;
    color: ${({ theme }): string => theme.primaryColor};
  }
`;

interface Props {
  seed: string;
  onCopy: MouseEventHandler<HTMLDivElement>;
  onPrint: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

const ButtonsRow = styled.div`
  display: flex;
  flex-direction: row;
  
  ${ActionText} {
    margin-right: 32px;
  }
`;

function MnemonicSeed ({ seed, onCopy, onPrint, className }: Props): React.ReactElement<Props> {
  return <div className={className}>
    <MnemonicText value={seed}/>
    <ButtonsRow>
      <ActionText data-seed-action='copy' icon={copy} text='Copy to clipboard' onClick={onCopy}/>
      <ActionText data-seed-action='print' icon={print} text='Print seed phrase' onClick={onPrint}/>
    </ButtonsRow>
  </div>;
}

export default styled(MnemonicSeed)`
  margin-top: 21px;
`;
