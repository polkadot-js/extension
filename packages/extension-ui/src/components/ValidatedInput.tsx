// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { Result, Validator } from '../validators';

interface Props {
  className?: string;
  validator: Validator<string>;
  children: React.ReactElement<{
    isError: boolean;
    value: string;
    onChange: (value: string) => void;
  }>;
  onChange: (value: string | null) => void;
}

function ValidatedInput ({ className, validator, children, onChange }: Props): React.ReactElement<Props> {
  const [value, setValue] = useState('');
  const [wasMounted, setWasMounted] = useState(false);
  const [validationResult, setValidationResult] = useState<Result<string>>(Result.ok(''));

  useEffect(() => {
    if (!wasMounted) {
      setWasMounted(true);
      return;
    }
    (async (): Promise<void> => {
      const result = await validator(value);
      setValidationResult(result);
      onChange(Result.isOk(result) ? value : null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, validator, onChange]);

  return (
    <div className={className}>
      {React.cloneElement(children, { isError: Result.isError(validationResult), value, onChange: setValue })}
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
