// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import zxcvbn from 'zxcvbn';

export type ValidationResult = {
  score: 0 | 1 | 2 | 3 | 4;
  warning: string;
  suggestions: Array<string>;
};

const LOWEST_ACCEPTED_PASSWORD_SCORE = 3;

export function isPasswordTooWeak(feedback: ValidationResult): boolean {
  return feedback.score < LOWEST_ACCEPTED_PASSWORD_SCORE;
}

export default function zxcvbnResultAdapter(password: string, userInputs?: string[]): ValidationResult {
  const {feedback: {suggestions, warning}, score} = zxcvbn(password, userInputs);

  return {
    score,
    warning,
    suggestions,
  };
}