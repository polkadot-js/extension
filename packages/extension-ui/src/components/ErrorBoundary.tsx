// Copyright 2019-2020 @polkadot/extension-ui authors & contributor
// SPDX-License-Identifier: Apache-2.0

import { WithTranslation } from 'react-i18next';

import React from 'react';
// import styled from 'styled-components';

import translate from './translate';
import Header from '../partials/Header';
import ActionText from './ActionText';
// import { ThemeProps } from '../types';

interface Props extends WithTranslation {
  children: React.ReactNode;
  className?: string;
  error?: Error | null;
  onError?: () => void;
}

interface State {
  error: Error | null;
}

// NOTE: This is the only way to do an error boundary, via extend
class ErrorBoundary extends React.Component<Props> {
  state: State = { error: null };

  static getDerivedStateFromError (error: Error): Partial<State> {
    return { error };
  }

  public componentDidCatch (): void {
    const { onError } = this.props;

    onError && onError();
  }

  public render (): React.ReactNode {
    const { children, error: errorProps, t } = this.props;
    const { error } = this.state;
    const displayError = errorProps || error;

    console.log('errorProps', errorProps);
    console.log('error', error);

    const _goHome = () => {
      this.setState({ error: null });
      window.location.hash = '/';
    };

    return displayError
      ? (
        <>
          <Header text={t<string>('An error occured')} />
          <div>
            {t<string>('Something went wrong with the query and rendering of this component. {{message}}', {
              replace: { message: displayError.message }
            })}
            <ActionText
              onClick={_goHome}
              text={t<string>('Cancel')}
            />
          </div>
        </>
      )
      : children;
  }
}

export default translate(ErrorBoundary);
