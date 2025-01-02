// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResultType, Validator } from '../util/validators.js';

import React, { useEffect, useState } from 'react';

import { useIsMounted } from '../hooks/index.js';
import { Result } from '../util/validators.js';
import Warning from './Warning.js';

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
}

function ValidatedInput<T extends Record<string, unknown>> ({ className, component: Input, defaultValue, onValidatedChange, validator, ...props }: Props<T>): React.ReactElement<Props<T>> {
  const [value, setValue] = useState(defaultValue || '');
  const [validationResult, setValidationResult] = useState<ResultType<string>>(Result.ok(''));
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
        {...props as unknown as T}
        isError={Result.isError(validationResult)}
        onChange={setValue}
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
    </div>
  );
}

export default ValidatedInput;
