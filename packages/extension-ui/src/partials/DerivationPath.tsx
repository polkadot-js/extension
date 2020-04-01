// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import { InputWithLabel } from '@polkadot/extension-ui/components';
import { validateDerivationPath } from '@polkadot/extension-ui/messaging';

interface Props {
  onChange: (derivedAccount: { address: string; suri: string } | null) => void;
  parentAddress: string;
  parentPassword: string;
}

function DerivationPath ({ onChange, parentAddress, parentPassword }: Props): React.ReactElement<Props> {
  const [path, setPath] = useState<string>('');
  const [isValid, setValid] = useState(false);

  const _onChange = useCallback(
    async (newPath: string) => {
      setPath(newPath);

      try {
        onChange(await validateDerivationPath(parentAddress, newPath, parentPassword));
        setValid(true);
      } catch (err) {
        onChange(null);
        setValid(false);
      }
    },
    [parentAddress, onChange, parentPassword]
  );

  return (
    <div>
      <InputWithLabel
        isError={!isValid}
        label='Derivation path'
        onChange={_onChange}
        placeholder='//hard/soft'
        value={path}
      />
    </div>
  );
}

export default DerivationPath;
