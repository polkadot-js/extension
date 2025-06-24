// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

// Configure zxcvbn with English dictionary and common patterns
zxcvbnOptions.setOptions({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary, // common words across languages
    ...zxcvbnEnPackage.dictionary // english-specific dictionary
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs, // keyboard patterns
  translations: zxcvbnEnPackage.translations // language translations for feedback messages
});

export interface PasswordStrength {
  feedback: {
    warning: string;
    suggestions: string[];
  };
  score: number; // 0-4 (0: very weak, 4: very strong)
}

const MIN_LENGTH = 6; // Minimum password length requirement

export function validatePasswordStrength (password: string): PasswordStrength {
  const result = zxcvbn(password);

  // First check: Minimum length requirement
  if (password.length < MIN_LENGTH) {
    return {
      feedback: {
        suggestions: [`Password must be at least ${MIN_LENGTH} characters long`],
        warning: 'Password is too short'
      },
      score: 0
    };
  }

  // Combine zxcvbn suggestions with our custom ones
  const suggestions = [...(result.feedback.suggestions || [])];

  return {
    feedback: {
      suggestions,
      warning: result.feedback.warning || ''
    },
    score: result.score
  };
}
