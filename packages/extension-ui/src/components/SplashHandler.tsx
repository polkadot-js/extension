// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import type { ThemeProps } from '@polkadot/extension-ui/types';

import React, { useRef, useState } from 'react';
import { Transition, TransitionStatus } from 'react-transition-group';
import styled, { CSSProperties } from 'styled-components';

import { Video } from '@polkadot/extension-ui/components/index';

interface SplashHandlerProps extends ThemeProps {
  className?: string;
  children: ReactNode;
}

function SplashHandler({ children, className }: SplashHandlerProps): React.ReactElement<SplashHandlerProps> {
  // Needs this graduality to avoid flashes on rendering contents between video and app
  const [splashOn, setSplashState] = useState<boolean>(true);
  const [contentVisible, setContentVisible] = useState<boolean>(false);
  const nodeRef = useRef(null);
  const duration = 250;

  const defaultStyle: Partial<CSSProperties> = {
    display: 'block',
    opacity: 1,
    transition: `opacity ${duration}ms ease-out`
  };

  const transitionStyles: Partial<{
    [key in TransitionStatus]: Partial<CSSProperties>;
  }> = {
    entered: { opacity: 1 },
    exited: { display: 'none', opacity: 0 },
    exiting: { opacity: 0 }
  };

  return (
    <div className={className}>
      <Transition
        in={splashOn}
        nodeRef={nodeRef}
        timeout={duration}
      >
        {(state) => (
          <div
            className='splash'
            ref={nodeRef}
            style={{
              ...defaultStyle,
              ...transitionStyles[state]
            }}
          >
            <Video
              onEnded={setSplashState}
              onStarted={setContentVisible}
              source='videos/splash.mp4'
              type='video/mp4'
            />
          </div>
        )}
      </Transition>
      {contentVisible && children}
    </div>
  );
}

export default styled(SplashHandler)`
  display: flex;
  flex-direction: column;
  height: 100%;

  > *:not(.splash):not(.header) {
    padding-left: 16px;
    padding-right: 16px;
  }

  .splash {
    position: absolute;
    z-index: 101;
  }
  `;
