// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import { InputWithLabel } from '@polkadot/extension-ui/components';
import { validateDerivationPath } from '@polkadot/extension-ui/messaging';

interface Props {
  onChange: (derivedAccount: { address: string; suri: string } | null) => void;
  parentAddress: string;
}

function DerivationPath({onChange, parentAddress}: Props): React.ReactElement<Props> {
  const [path, setPath] = useState<string>('');
  const [isValid, setValid] = useState(false);

  const _onChange = useCallback(async (newPath: string) => {
    setPath(newPath);
    try {
      onChange(await validateDerivationPath(parentAddress, newPath));
      setValid(true);
    } catch (err) {
      onChange(null);
      setValid(false);
    }
  }, [parentAddress]);

  return (
    <div>
      <InputWithLabel
        label='Derivation path'
        placeholder='//hard/soft///password'
        onChange={_onChange}
        value={path}
        isError={!isValid}
      />
    </div>
  );
}

export default DerivationPath;
