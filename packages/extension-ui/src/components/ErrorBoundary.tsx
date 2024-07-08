// Copyright 2019-2024 @polkadot/extension-ui authors & contributor
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Header from '../partials/Header';
import Button from './Button';
import ButtonArea from './ButtonArea';
import VerticalSpace from './VerticalSpace';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  className?: string;
  error?: Error | null;
  trigger?: string;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, error: propError, trigger }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error !== null && trigger) {
      setError(null);
    }
  }, [trigger]);

  useEffect(() => {
    if (propError) {
      setError(propError);
    }
  }, [propError]);

  const goHome = () => {
    setError(null);
    window.location.hash = '/';
  };

  if (error) {
    return (
      <>
        <Header text={t('An error occurred')} />
        <div>
          {t('Something went wrong with the query and rendering of this component. {{message}}', {
            replace: { message: error.message }
          })}
        </div>
        <VerticalSpace />
        <ButtonArea>
          <Button onClick={goHome}>
            {t('Back to home')}
          </Button>
        </ButtonArea>
      </>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;
