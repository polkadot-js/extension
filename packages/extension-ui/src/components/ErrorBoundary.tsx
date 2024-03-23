// Copyright 2019-2024 @polkadot/extension-ui authors & contributor
// SPDX-License-Identifier: Apache-2.0

import type { WithTranslation } from 'react-i18next';

import React from 'react';
import { withTranslation } from 'react-i18next';

import Header from '../partials/Header.js';
import Button from './Button.js';
import ButtonArea from './ButtonArea.js';
import VerticalSpace from './VerticalSpace.js';

interface Props extends WithTranslation {
  children: React.ReactNode;
  className?: string;
  error?: Error | null;
  trigger?: string;
}

interface State {
  error: Error | null;
}

const translate = withTranslation();

// NOTE: This is the only way to do an error boundary, via extend
class ErrorBoundary extends React.Component<Props> {
  public override state: State = { error: null };

  public static getDerivedStateFromError (error: Error): Partial<State> {
    return { error };
  }

  public override componentDidUpdate (prevProps: Props) {
    const { error } = this.state;
    const { trigger } = this.props;

    if (error !== null && (prevProps.trigger !== trigger)) {
      this.setState({ error: null });
    }
  }

  #goHome = () => {
    this.setState({ error: null });
    window.location.hash = '/';
  };

  public override render (): React.ReactNode {
    const { children, t } = this.props;
    const { error } = this.state;

    return error
      ? (
        <>
          <Header text={t<string, Record<string, string>, string>('An error occurred')} />
          <div>
            {t('Something went wrong with the query and rendering of this component. {{message}}', {
              replace: { message: error.message }
            })}
          </div>
          <VerticalSpace />
          <ButtonArea>
            <Button
              onClick={this.#goHome}
            >
              {t('Back to home')}
            </Button>
          </ButtonArea>
        </>
      )
      : children;
  }
}

export default translate(ErrorBoundary);
