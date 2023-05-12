// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import styled, { useTheme } from 'styled-components';

import useTranslation from '../../hooks/useTranslation';
import { isPasswordTooWeak, ValidationResult } from './getFeedback';
import ProgressBar from './ProgressBar';
import TransitionMessage from './TransitionMessage';

type Props = {
  className?: string,
  feedback: ValidationResult,
  isCapsLockOn?: boolean;
}

function PasswordFeedback({
  className,
  feedback: {score, suggestions, warning},
  feedback,
  isCapsLockOn = false,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const scoreToColor = {
    0: theme.errorColor, 1: theme.errorColor, 2: theme.errorColor, 3: theme.warningColor, 4: theme.primaryColor
  };

  const isTooWeak = isPasswordTooWeak(feedback);

  const defaultCriticalMessage = isTooWeak ? t('Password is too weak.') : '';
  const criticalMessage = warning || defaultCriticalMessage;
  const duration = 500;

  return (
    <div className={className}>
      <ProgressBar
        activeColor={scoreToColor[score]}
        activeStepsCount={score + 1}
        inactiveColor={theme.progressBarInactive}
        stepCount={5}
      />
      <StyledTransitionMessage
        duration={duration}
        in={score === 4}
        messageType='success'
        text={t("Awesome! Your password is really strong")}
      />
      <StyledTransitionMessage
        duration={duration}
        in={isTooWeak}
        messageType='critical'
        text={t(criticalMessage)}
      />
      <StyledTransitionMessage
        duration={duration}
        in={score === 3}
        messageType='warning'
        text={t("Your password could be stronger!")}
      />
      <StyledTransitionMessage
        duration={duration}
        in={!!isCapsLockOn}
        messageType='warning'
        text={t('CapsLock is ON')}
      />
      <TransitionGroup component={null}>
        {suggestions.map((suggestion, index) => (
          <StyledTransitionMessage
            duration={duration}
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

const StyledTransitionMessage = styled(TransitionMessage)`
  margin-inline: 15px;
`;

export default styled(PasswordFeedback)`
  & > :not(:last-child) {
    margin-bottom: 8px;
  }
`;
