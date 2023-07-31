import type { ReactNode } from 'react';
import type { ThemeProps } from '@polkadot/extension-ui/types';

import React, { useEffect, useRef, useState } from 'react';
import { Transition, TransitionStatus } from 'react-transition-group';
import styled, { CSSProperties } from 'styled-components';

import { Video } from '@polkadot/extension-ui/components/index';

import { Steps } from '../partials/HeaderWithSteps';
import { Z_INDEX } from '../zindex';
import ScrollWrapper from './ScrollWrapper';

interface SplashHandlerProps extends ThemeProps {
  className?: string;
  children: ReactNode;
}

function SplashHandler({ children, className }: SplashHandlerProps): React.ReactElement<SplashHandlerProps> {
  // Needs this graduality to avoid flashes on rendering contents between video and app
  const [isSplashOn, setIsSplashOn] = useState<boolean>(true);
  const [isContentVisible, setIsContentVisible] = useState<boolean>(false);
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

  useEffect(() => {
    if (!isContentVisible) {
      return;
    }

    const updateWithErrorLog = (prevIsSplashOn: boolean) => {
      if (prevIsSplashOn) {
        console.error('Fallback timeout needed to turn off splash video.');
      }

      return false;
    };

    const timeoutId = setTimeout(setIsSplashOn, 2000, updateWithErrorLog);

    return () => clearTimeout(timeoutId);
  }, [isContentVisible]);

  return (
    <div className={className}>
      <Transition
        in={isSplashOn}
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
              onEnded={() => setIsSplashOn(false)}
              onStarted={() => setIsContentVisible(true)}
              source='videos/splash.mp4'
              type='video/mp4'
            />
          </div>
        )}
      </Transition>
      {isContentVisible && children}
    </div>
  );
}

export default styled(SplashHandler)`
  display: flex;
  flex-direction: column;
  height: 100%;

  > *:not(.splash):not(.header):not(${ScrollWrapper}):not(${Steps}) {
    padding-left: 16px;
    padding-right: 16px;
  }

  .splash {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: ${Z_INDEX.SPLASH_HEADER};
  }

  `;
