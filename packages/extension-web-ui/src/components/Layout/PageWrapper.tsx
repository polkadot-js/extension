// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingScreen } from '@subwallet/extension-web-ui/components';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useEffect, useState } from 'react';
import { Await, useLocation } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';

export interface PageWrapperProps extends ThemeProps{
  resolve?: Promise<any>;
  children?: React.ReactNode;
  animateOnce?: boolean;
  hideLoading?: boolean;
  loadingClass?: string;
}

const defaultResolver = Promise.resolve(true);

function Component ({ animateOnce, children, className, hideLoading, loadingClass, resolve }: PageWrapperProps) {
  const nodeRef = React.useRef(null);
  const location = useLocation();
  const [pathName, setPathName] = useState<string | undefined>();

  useEffect(() => {
    setPathName((prevPathName) => {
      if (animateOnce && prevPathName) {
        return prevPathName;
      }

      return location.pathname;
    });
  }, [animateOnce, location.pathname]);

  return <React.Suspense fallback={!hideLoading && <LoadingScreen className={loadingClass} />}>
    <Await resolve={resolve || defaultResolver}>
      <CSSTransition
        classNames={'page'}
        in={!!(animateOnce && pathName) || pathName === location.pathname}
        nodeRef={nodeRef}
        timeout={300}
        unmountOnExit
      >
        <div
          className={className}
          ref={nodeRef}
        >
          {children}
        </div>
      </CSSTransition>
    </Await>
  </React.Suspense>;
}

const PageWrapper = styled(Component)<PageWrapperProps>(({ theme }) => ({
  height: '100%',

  '&__inner': {
    height: '100%'
  }
}));

export default PageWrapper;
