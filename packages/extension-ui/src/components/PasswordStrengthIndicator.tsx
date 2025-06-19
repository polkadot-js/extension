// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { PasswordStrength } from '../util/passwordValidation.js';

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  passwordStrength: PasswordStrength;
}

function PasswordStrengthIndicator ({ className, passwordStrength }: Props): React.ReactElement<Props> {
  const { feedback, score } = passwordStrength;

  const strengthColors = [
    '#ff4444', // Very Weak - Red
    '#ffa700', // Weak - Orange
    '#ffeb3b', // Medium - Yellow
    '#00C853', // Strong - Light Green
    '#00695C' // Very Strong - Dark Green
  ];

  return (
    <div className={className}>
      <div className='strength-meter'>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            className={`strength-segment ${index <= score ? 'active' : ''}`}
            key={index}
            style={{
              backgroundColor: index <= score ? strengthColors[score] : '#e0e0e0'
            }}
          />
        ))}
      </div>
      {feedback.suggestions.length > 0 && (
        <ul className='suggestions'>
          {feedback.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default styled(PasswordStrengthIndicator)`
  .strength-meter {
    margin-top: 0.5rem;
    display: flex;
    margin-bottom: 0.5rem;
  }

  .strength-segment {
    flex: 1;
    height: 4px;
    margin: 0 2px;
  }

  .strength-label {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .suggestions {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    font-size: 0.85rem;
    color: var(--warning-color);
  }
`;
