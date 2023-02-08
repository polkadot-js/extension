// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {useEffect, useState} from "react";
import {Await, useLocation} from "react-router-dom";
import {LoadingContainer} from "@subwallet/extension-koni-ui/components";
import {CSSTransition} from "react-transition-group";

export interface PageWrapperProps {
  className?: string;
  resolve?: Promise<any>;
  children?: React.ReactElement;
}

const defaultResolver = Promise.resolve(true);

// Todo: Create data loader wrapper
// Todo: Create loading effect
export default function PageWrapper ({ children, resolve, className }: PageWrapperProps) {
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
          <div ref={nodeRef}>
            {children}
          </div>
        </CSSTransition>
      </Await>
    </React.Suspense>
  </div>;
}
