// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useIsCapsLockOn } from '../hooks/useIsCapsLockOn';
import useIsMounted from '../hooks/useIsMounted';
import { Result, Validator } from '../util/validators';
import Message from './PasswordField/Message';
import { useTranslation } from './translate';
import Warning from './Warning';

interface BasicProps {
  isError?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

type Props<T extends BasicProps> = T & {
  className?: string;
  component: React.ComponentType<T>;
  defaultValue?: string;
  onValidatedChange: (value: string) => void;
  validator: Validator<string>;
  shouldCheckCapsLock?: boolean;
};

function ValidatedInput<T extends Record<string, unknown>>({
  className,
  component: Input,
  defaultValue,
  onValidatedChange,
  shouldCheckCapsLock = false,
  validator,
  ...props
}: Props<T>): React.ReactElement<Props<T>> {
  const {t} = useTranslation();

  const [value, setValue] = useState(defaultValue || '');
  const {handleKeyDown, isCapsLockOn} = useIsCapsLockOn();

  const [validationResult, setValidationResult] = useState<Result<string>>(Result.ok(''));
  const isMounted = useIsMounted();

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    // Do not show any error on first mount
    if (!isMounted) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      const result = await validator(value);

      setValidationResult(result);
      onValidatedChange(Result.isOk(result) ? value : '');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, validator, onValidatedChange]);

  return (
    <div className={className}>
      <Input
        {...(props as unknown as T)}
        isError={Result.isError(validationResult)}
        onChange={setValue}
        onKeyDown={handleKeyDown}
        value={value}
      />
      {Result.isError(validationResult) && (
        <Warning
          isBelowInput
          isDanger
        >
          {validationResult.error.errorDescription}
        </Warning>
      )}
      {shouldCheckCapsLock && isCapsLockOn && (
        <StyledMessage messageType='warning'>
          {t('CapsLock is ON')}
        </StyledMessage>
      )}
    </div>
  );
}

const StyledMessage = styled(Message)`
  margin-left: 16px;
  margin-bottom: 8px;
`;

export default styled(ValidatedInput)``;
