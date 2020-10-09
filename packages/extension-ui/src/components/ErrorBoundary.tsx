// Copyright 2019-2020 @polkadot/extension-ui authors & contributor
// SPDX-License-Identifier: Apache-2.0

import { WithTranslation } from 'react-i18next';

import React from 'react';

import ButtonArea from './ButtonArea';
import Button from './Button';
import VerticalSpace from './VerticalSpace';
import Header from '../partials/Header';
import translate from './translate';

interface Props extends WithTranslation {
  children: React.ReactNode;
  className?: string;
  error?: Error | null;
  trigger?: string;
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

  componentDidUpdate (prevProps: Props) {
    const { error } = this.state;
    const { trigger } = this.props;

    if (error !== null && (prevProps.trigger !== trigger)) {
      this.setState({ error: null });
    }
  }

  goHome = () => {
    this.setState({ error: null });
    window.location.hash = '/';
  };

  public render (): React.ReactNode {
    const { children, t, trigger } = this.props;
    const { error } = this.state;

    return error
      ? (
        <>
          <Header text={t<string>('An error occured')} />
          <div>
            {t<string>('Something went wrong with the query and rendering of this component. {{message}}', {
              replace: { message: error.message }
            })}
          </div>
          <VerticalSpace/>
          <ButtonArea>
            <Button
              onClick={this.goHome}
            >
              {t<string>('Back to home')}
            </Button>
          </ButtonArea>
        </>
      )
      : children;
  }
}

export default translate(ErrorBoundary);
