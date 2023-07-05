// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import zxcvbn from 'zxcvbn';

export type ValidationResult = {
  score: 0 | 1 | 2 | 3 | 4;
  warning: string;
  suggestions: Array<string>;
};

const LOWEST_ACCEPTED_PASSWORD_SCORE = 3;

const APP_RELATED_INPUTS = ['aleph', 'zero', 'aleph zero', 'signer'];

export const getUserInputs = (name?: string | null) => {
  const nameRelatedInputs = name ? [name, ...name.split(/[^a-zA-Z]+/)] : [];

  return [...APP_RELATED_INPUTS, ...nameRelatedInputs];
};

export const isPasswordTooWeak = (feedback: ValidationResult) => {
  return feedback.score < LOWEST_ACCEPTED_PASSWORD_SCORE;
};

const nonLatinAlphanumeric = /\W/;

const addPunctuationIfMissing = (sentence: string) => {
  const lastChar = sentence.at(-1);

  if (!lastChar) {
    return sentence;
  }

  if (lastChar.match(nonLatinAlphanumeric)) {
    return sentence;
  }

  return `${sentence}.`;
};

const zxcvbnResultAdapter = (password: string, userInputs?: string[]): ValidationResult => {
  const {
    feedback: { suggestions, warning },
    score
  } = zxcvbn(password, userInputs);

  return {
    score,
    warning: addPunctuationIfMissing(warning),
    suggestions: suggestions.map(addPunctuationIfMissing)
  };
};

export default zxcvbnResultAdapter;
