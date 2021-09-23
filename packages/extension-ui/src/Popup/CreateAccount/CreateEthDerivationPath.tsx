// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@polkadot/extension-ui/hooks/useTranslation';
import BN from 'bn.js';
import React, { ReactNode, useEffect, useState } from 'react';

import {InputWithLabel, Dropdown, Checkbox } from '../../components';

// import { useToggle } from '@polkadot/react-hooks';

// import { useTranslation } from '../translate';
// import { DeriveValidationOutput } from '../types';

interface Props {
  className?: string;
  onChange: (string: string) => void;
  // seedType: string;
  derivePath: string;
  //deriveValidation: DeriveValidationOutput | undefined;
  // seed: string;
}

export const ETH_DEFAULT_PATH = "m/44'/60'/0'/0/0";

function CreateEthDerivationPath ({ className,
  derivePath,
  // deriveValidation,
  onChange,
  // seedType 
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [addIndex, setAddIndex] = useState(0);
  const [customIndex, setCustomIndex] = useState(new BN(0));
  const [addressList] = useState<{ key: number; text: ReactNode; value: number; }[]>(new Array(10).fill(0).map((_, i) => ({
    key: i,
    text: t('Address index {{index}}', {
      replace: { index: i }
    }),
    value: i
  })));
  const [useCustomPath, setUseCustomPath] =  useState(false);
  const [useCustomIndex, setUseCustomIndex] = useState(false);

  // const errorIndex = useRef<Record<string, string>>({
  //   INVALID_DERIVATION_PATH: t<string>('This is an invalid derivation path.'),
  //   PASSWORD_IGNORED: t<string>('Password are ignored for hex seed'),
  //   SOFT_NOT_ALLOWED: t<string>('Soft derivation paths are not allowed on ed25519'),
  //   WARNING_SLASH_PASSWORD: t<string>('Your password contains at least one "/" character. Disregard this warning if it is intended.')
  // });
  function setCustomIndexText(inp:string){
    setCustomIndex(new BN(inp))
  }

  useEffect((): void => {
    onChange(`m/44'/60'/0'/0/${useCustomIndex ? Number(customIndex) : addIndex}`);
  }, [customIndex, onChange, useCustomIndex, addIndex]);

  return (
          <>
            <div className='saveToggle'>
              <Checkbox
                    checked={useCustomIndex}
                    label={t<string>('Use custom address index')}
                    onChange={setUseCustomIndex}
                />
            </div>
            {useCustomIndex
              ? (
                <InputWithLabel
                    label={t<string>('Custom index')}
                    onChange={setCustomIndexText}
                    type='text'
                    className={className}
                />
              )
              : (
                <Dropdown
                className={'derivation-path'}
                label={t<string>('address index')}
                onChange={setAddIndex}
                options={addressList}
                value={addIndex}
              />
              )}
            <div className='saveToggle'>
              <Checkbox
                    checked={useCustomPath}
                    label={t<string>('Use custom derivation index')}
                    onChange={setUseCustomPath}
                />
            </div>
            {useCustomPath
              ? (
                <InputWithLabel
                    label={t<string>('secret derivation path')}
                    onChange={onChange}
                    type='text'
                    value={derivePath}
                    className={className}
                />
              )
              : null}
          </>
  );
}

export default React.memo(CreateEthDerivationPath);
