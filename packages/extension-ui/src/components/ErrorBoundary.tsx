// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { Component, ErrorInfo, FC, ReactNode } from "react";

type State = { hasError: boolean };

type Props = {
  Fallback: FC,
  children: ReactNode
};

export default class ErrorBoundary extends Component<Props> {
  override state: State = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  override render() {
    if (this.state.hasError) {
      const { Fallback } = this.props;

      return <Fallback />;
    }

    return this.props.children;
  }
}
