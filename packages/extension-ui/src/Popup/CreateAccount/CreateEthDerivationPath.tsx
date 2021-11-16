// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import React, { ReactNode, useEffect, useState } from 'react';

import useTranslation from '@polkadot/extension-ui/hooks/useTranslation';

import { Checkbox, Dropdown, InputWithLabel } from '../../components';

interface Props {
  className?: string;
  onChange: (string: string) => void;
  derivePath: string;
}

export const ETH_DEFAULT_PATH = "m/44'/60'/0'/0/0";

function CreateEthDerivationPath ({ className,
  derivePath,
  onChange }: Props): React.ReactElement<Props> {
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
  const [useCustomPath, setUseCustomPath] = useState(false);
  const [useCustomIndex, setUseCustomIndex] = useState(false);

  function setCustomIndexText (inp: string) {
    setCustomIndex(new BN(inp));
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
            className={className}
            label={t<string>('Custom index')}
            onChange={setCustomIndexText}
            type='text'
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
            className={className}
            label={t<string>('secret derivation path')}
            onChange={onChange}
            type='text'
            value={derivePath}
          />
        )
        : null}
    </>
  );
}

export default React.memo(CreateEthDerivationPath);
