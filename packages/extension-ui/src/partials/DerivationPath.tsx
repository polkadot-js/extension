// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import { validateDerivationPath } from '@polkadot/extension-ui/messaging';
import { InputWithLabel, ValidatedInput } from '../components';
import { Result } from '../validators';

interface Props {
  onChange: (derivedAccount: { address: string; suri: string } | null) => void;
  parentAddress: string;
  parentPassword: string;
  defaultPath: string;
}

function DerivationPath ({ defaultPath, onChange, parentAddress, parentPassword }: Props): React.ReactElement<Props> {
  const [path, setPath] = useState<string>(defaultPath);
  const isPathValid = useCallback(async (newPath: string): Promise<Result<string>> => {
    try {
      await validateDerivationPath(parentAddress, newPath, parentPassword);

      return Result.ok(newPath);
    } catch (error) {
      return Result.error(newPath === path ? '' : 'Invalid derivation path');
    }
  }, [path, parentAddress, parentPassword]);

  const _onChange = useCallback(async (newPath: string | null) => {
    newPath !== null && setPath(newPath);
    onChange(newPath === null ? null : await validateDerivationPath(parentAddress, newPath, parentPassword));
  }, [parentAddress, onChange, parentPassword]);

  return (
    <ValidatedInput
      component={InputWithLabel}
      data-input-suri
      defaultValue={defaultPath}
      label='Derivation path'
      onValidatedChange={_onChange}
      placeholder='//hard/soft'
      validator={isPathValid}
      value={path}
    />
  );
}

export default DerivationPath;
