// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { Result, Validator } from '../validators';

interface BasicProps {
  isError?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

type Props<T extends BasicProps> = T & {
  className?: string;
  validator: Validator<string>;
  component: React.ComponentType<T>;
  onValidatedChange: (value: string | null) => void;
  defaultValue?: string;
}

function ValidatedInput<T extends object> ({ className, component: Input, defaultValue, onValidatedChange, validator, ...props }: Props<T>): React.ReactElement<Props<T>> {
  const [value, setValue] = useState(defaultValue || '');
  const [wasMounted, setWasMounted] = useState(false);
  const [validationResult, setValidationResult] = useState<Result<string>>(Result.ok(''));

  useEffect(() => {
    if (!wasMounted) {
      setWasMounted(true);
    }

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
        {...props as T}
        isError={Result.isError(validationResult)}
        onChange={setValue}
        value={value}
      />
      {Result.isError(validationResult) && <ErrorMessage>{validationResult.error.errorDescription}</ErrorMessage>}
    </div>
  );
}

const ErrorMessage = styled.span`
  display: block;
  margin-top: -10px;
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.errorColor};
`;

ErrorMessage.displayName = 'ErrorMessage';

export default ValidatedInput;
