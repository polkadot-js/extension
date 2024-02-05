// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DebuggerLogoPreview from '@subwallet/extension-web-ui/Popup/Debugger/DebuggerLogoPreview';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button } from '@subwallet/react-ui';
import React, { useState } from 'react';
import styled from 'styled-components';

import { DebuggerAPI } from './DebuggerAPI';
import { DebuggerMenu } from './DebuggerMenu';

interface Props {
  className?: string;
  title?: string;
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const [mode, setMode] = useState<'menu' | 'api' | 'logo'>('logo');

  const applyMode = (mode: 'menu' | 'api' | 'logo') => {
    return () => {
      setMode(mode);
    };
  };

  return (
    <div className={className}>
      <div className='select-mode'>
        <Button
          disabled={mode === 'menu'}
          onClick={applyMode('menu')}
          size='xs'
        >Menu</Button>
        <Button
          disabled={mode === 'api'}
          onClick={applyMode('api')}
          size='xs'
        >API</Button>
        <Button
          disabled={mode === 'logo'}
          onClick={applyMode('logo')}
          size='xs'
        >Logo</Button>
      </div>
      <div className='debugger-content'>
        {mode === 'menu' && <DebuggerMenu />}
        {mode === 'api' && <DebuggerAPI />}
        {mode === 'logo' && <DebuggerLogoPreview />}
      </div>
    </div>
  );
}

export const Debugger = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => {
  return ({
    textAlign: 'left',
    '.select-mode button': {
      marginRight: (token.sizeMD || 0) / 2,
      marginBottom: (token.sizeMD || 0) / 2
    }
  });
});

export default Debugger;
