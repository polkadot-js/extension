// Copyright 2019-2020 @polkadot/extension-ui authors & contributor
// SPDX-License-Identifier: Apache-2.0

import { WithTranslation } from 'react-i18next';

import React from 'react';

import translate from './translate';

interface Props extends WithTranslation {
  children: React.ReactNode;
  doThrow?: boolean;
  error?: Error | null;
  onError?: () => void;
  trigger?: unknown;
}

interface State {
  error: Error | null;
  prevTrigger: string | null;
}

// NOTE: This is the only way to do an error boundary, via extend
class ErrorBoundary extends React.Component<Props> {
  state: State = { error: null, prevTrigger: null };

  static getDerivedStateFromError (error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps ({ trigger }: Props, { prevTrigger }: State): State | null {
    const newTrigger = JSON.stringify({ trigger });

    return (prevTrigger !== newTrigger)
      ? { error: null, prevTrigger: newTrigger }
      : null;
  }

  public componentDidCatch (error: Error): void {
    const { doThrow, onError } = this.props;

    onError && onError();

    if (doThrow) {
      throw error;
    }
  }

  public render (): React.ReactNode {
    const { children, error: errorProps, t } = this.props;
    const { error } = this.state;
    const displayError = errorProps || error;

    return displayError
      ? (
        <div>
          {t<string>('Uncaught error. Something went wrong with the query and rendering of this component. {{message}}', {
            replace: { message: displayError.message }
          })}
        </div>
      )
      : children;
  }
}

export default translate(ErrorBoundary);
