// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import styled, { useTheme } from 'styled-components';

import useTranslation from '../../hooks/useTranslation';
import AnimatedMessage from '../AnimatedMessage';
import { isPasswordTooWeak, ValidationResult } from './getFeedback';
import ProgressBar from './ProgressBar';

type Props = {
  className?: string;
  feedback: ValidationResult;
  isCapsLockOn?: boolean;
};

function PasswordFeedback({
  className,
  feedback: { score, suggestions, warning },
  feedback,
  isCapsLockOn = false
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const scoreToColor = {
    0: theme.errorColor,
    1: theme.errorColor,
    2: theme.errorColor,
    3: theme.warningColor,
    4: theme.primaryColor
  };

  const isTooWeak = isPasswordTooWeak(feedback);

  const defaultCriticalMessage = isTooWeak ? t('Password is too weak.') : '';
  const criticalMessage = warning || defaultCriticalMessage;

  return (
    <div className={className}>
      <ProgressBar
        activeColor={scoreToColor[score]}
        activeStepsCount={score + 1}
        inactiveColor={theme.progressBarInactive}
        stepCount={5}
      />
      <StyledAnimatedMessage
        in={score === 4}
        messageType='success'
        text={t('Awesome! Your password is really strong.')}
      />
      <StyledAnimatedMessage
        in={isTooWeak}
        messageType='critical'
        text={t(criticalMessage)}
      />
      <StyledAnimatedMessage
        in={score === 3}
        messageType='warning'
        text={t('Your password could be stronger!')}
      />
      <StyledAnimatedMessage
        in={!!isCapsLockOn}
        messageType='warning'
        text={t('CapsLock is ON')}
      />
      <TransitionGroup component={null}>
        {suggestions.map((suggestion, index) => (
          <StyledAnimatedMessage
            in={!!suggestion}
            key={index}
            messageType='info'
            text={typeof suggestion === 'string' ? t(suggestion) : ''}
          />
        ))}
      </TransitionGroup>
    </div>
  );
}

const StyledAnimatedMessage = styled(AnimatedMessage)`
  margin-inline: 16px;
`;

export default styled(PasswordFeedback)`
  & > * + * {
    margin-top: 8px;
  }
`;
