// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingContainer } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useEffect, useState } from 'react';
import { Await, useLocation } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';

export interface PageWrapperProps extends ThemeProps{
  resolve?: Promise<any>;
  children?: React.ReactNode;
}

const defaultResolver = Promise.resolve(true);

function Component ({ children, className = '', resolve }: PageWrapperProps) {
  const nodeRef = React.useRef(null);
  const location = useLocation();
  const [pathName, setPathName] = useState('');

  useEffect(() => {
    setPathName(location.pathname);
  }, [location.pathname]);

  return <div className={className}>
    <React.Suspense fallback={<LoadingContainer />}>
      <Await resolve={resolve || defaultResolver}>
        <CSSTransition
          classNames={'page'}
          in={pathName === location.pathname}
          nodeRef={nodeRef}
          timeout={300}
          unmountOnExit
        >
          <div
            className={`${className}__inner`}
            ref={nodeRef}
          >
            {children}
          </div>
        </CSSTransition>
      </Await>
    </React.Suspense>
  </div>;
}

const PageWrapper = styled(Component)<PageWrapperProps>(({ theme }) => ({
  height: '100%',

  '&__inner': {
    height: '100%'
  }
}));

export default PageWrapper;
