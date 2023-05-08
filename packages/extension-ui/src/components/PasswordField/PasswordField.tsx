// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { useIsCapsLockOn } from '@polkadot/extension-ui/hooks/useIsCapsLockOn';

import InputWithLabel from '../InputWithLabel';
import getFeedback, { isPasswordTooWeak, ValidationResult } from './getFeedback';
import PasswordFeedback from './PasswordFeedback';

type Props = {
  className?: string;
  label: string;
  onValidatedChange: (value: string) => void;
  validationUserInput?: Array<string>;
}

const PasswordField = ({
  className,
  label,
  onValidatedChange,
  validationUserInput,
}: Props) => {
  const [isTouched, setIsTouched] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [passwordFeedback, setPasswordFeedback] = useState<ValidationResult>({score: 0, warning: '', suggestions: []});
  const {handleKeyDown, isCapsLockOn} = useIsCapsLockOn();

  const onChange = useCallback((value: string): void => {
    setValue(value);
    setIsTouched(true);

    const feedback = getFeedback(value, validationUserInput);

    setPasswordFeedback(feedback);

    if (!isPasswordTooWeak(feedback)) {
      onValidatedChange(value);
    }
  }, [onValidatedChange, validationUserInput]);

  return (
    <div className={className}>
      <InputWithLabel
        data-input-password
        isError={isTouched && isPasswordTooWeak(passwordFeedback)}
        label={label}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        type='password'
        value={value}
      />
      {isTouched && (
        <StyledPasswordFeedback
          feedback={passwordFeedback}
          isCapsLockOn={isCapsLockOn}
        />
      )}
    </div>
  );
};

export const StyledPasswordFeedback = styled(PasswordFeedback)`
  margin-top: -8px;
  margin-bottom: 16px;
`;

export default PasswordField;
