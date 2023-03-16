// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import useIsMounted from '../hooks/useIsMounted';
import { ThemeProps } from '../types';
import { Result, Validator } from '../util/validators';
import Warning from './Warning';

interface BasicProps {
  isError?: boolean;
  value?: string | null;
  onChange?: (value: string) => void;
}

type Props<T extends BasicProps> = T & {
  className?: string;
  component: React.ComponentType<T>;
  defaultValue?: string;
  onValidatedChange: (value: string | null) => void;
  validator: Validator<string>;
  showPasswordElement?: React.ReactNode;
};

function ValidatedInput<T extends Record<string, unknown>>({
  className,
  component: Input,
  defaultValue,
  onValidatedChange,
  showPasswordElement,
  validator,
  ...props
}: Props<T>): React.ReactElement<Props<T>> {
  const [value, setValue] = useState(defaultValue || '');
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
      onValidatedChange(Result.isOk(result) ? value : null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, validator, onValidatedChange]);

  return (
    <div className={className}>
      <Input
        {...(props as unknown as T)}
        isError={Result.isError(validationResult)}
        onChange={setValue}
        value={value}
      />
      {showPasswordElement && showPasswordElement}
      {Result.isError(validationResult) && (
        <Warning
          isBelowInput
          isDanger
        >
          {validationResult.error.errorDescription}
        </Warning>
      )}
    </div>
  );
}

export default styled(ValidatedInput)`
position: relative;

.password-icon {
  all: unset;
  position: absolute;
  top: 18px;
  right: 20px;
  cursor: pointer;
}

.password-icon:focus {
  outline: ${({ theme }: ThemeProps): string => theme.boxBorderColor} 1px auto;
}

`;
