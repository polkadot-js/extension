// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, SwModal } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { Bug } from 'phosphor-react';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { DebuggerAPI } from './DebuggerAPI';
import { DebuggerMenu } from './DebuggerMenu';

interface Props {
  className?: string;
  title?: string;
}

const DebugIcon = <Icon
  phosphorIcon={Bug}
  type={'phosphor'}
/>;

const DEBUGGER_MODAL_ID = 'debugger-modal';

function Component ({ className }: Props): React.ReactElement<Props> {
  const location = useLocation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [mode, setMode] = useState<'menu' | 'api'>('menu');

  const openDebugger = useCallback(() => {
    activeModal(DEBUGGER_MODAL_ID);
  }, [activeModal]);

  const closeDebugger = useCallback(() => {
    inactiveModal(DEBUGGER_MODAL_ID);
  }, [inactiveModal]);

  const applyMode = (mode: 'menu' | 'api') => {
    return () => {
      setMode(mode);
    };
  };

  useEffect(() => {
    console.log(`Update location: ${location.pathname}`);
    closeDebugger();
  }, [closeDebugger, location.pathname]);

  return (
    <div className={className}>
      <Button
        block
        className='debugger-button'
        icon={DebugIcon}
        onClick={openDebugger}
        shape='round'
      />
      <SwModal
        className={className}
        id={DEBUGGER_MODAL_ID}
        onCancel={closeDebugger}
        title={'Debugger'}
      >
        <>
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
          </div>
          <div className='debugger-content'>
            {mode === 'menu' && <DebuggerMenu />}
            {mode === 'api' && <DebuggerAPI />}
          </div>
        </>
      </SwModal>
    </div>
  );
}

export const Debugger = styled(Component)<Props>(({ theme }: ThemeProps) => {
  const token = theme.token;

  return ({
    textAlign: 'left',
    '.debugger-button': {
      position: 'fixed',
      bottom: 90,
      right: token.sizeMD
    },

    '.select-mode button': {
      margin: (token.sizeMD || 0) / 2
    },

    '.debugger-content': {
      minHeight: 410
    }
  });
});
