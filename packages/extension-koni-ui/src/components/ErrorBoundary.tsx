// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributor
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { WithTranslation } from 'react-i18next';

import Header from '../partials/Header';
import Button from './Button';
import ButtonArea from './ButtonArea';
import translate from './translate';
import VerticalSpace from './VerticalSpace';

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
          <Header text={t<string>('An error occured')} />
          <div>
            {t<string>('Something went wrong with the query and rendering of this component. {{message}}', {
              replace: { message: error.message }
            })}
          </div>
          <VerticalSpace />
          <ButtonArea>
            <Button
              onClick={this.#goHome}
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
