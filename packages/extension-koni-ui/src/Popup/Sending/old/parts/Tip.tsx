// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Toggle from '@subwallet/extension-koni-ui/components/Toggle';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Registry } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import InputBalance from '../component/InputBalance';

interface Props extends ThemeProps {
  className?: string;
  onChange: (tip: BN) => void;
  registry: Registry;
}

function Tip ({ className, onChange, registry }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [tip, setTip] = useState(BN_ZERO);
  const [showTip, setShowTip] = useState(false);

  useEffect((): void => {
    onChange(showTip ? tip : BN_ZERO);
  }, [onChange, showTip, tip]);

  return (
    <div className={className}>
      <div className={'kn-l-toggle'}>
        <Toggle
          className='tipToggle'
          label={
            showTip
              ? t<string>('Include an optional tip for faster processing')
              : t<string>('Do not include a tip for the block author')
          }
          onChange={setShowTip}
          value={showTip}
        />
      </div>
      {showTip && (
        <div className={'kn-l-InputBalance'}>
          <InputBalance
            help={t<string>('Add a tip to this extrinsic, paying the block author for greater priority')}
            isZeroable
            label={t<string>('Tip (optional)')}
            onChange={setTip}
            registry={registry}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(styled(Tip)(({ theme }: ThemeProps) => `
  .kn-l-toggle {
    display: flex;
    justify-content: flex-end;
  }

  .kn-l-InputBalance {
    margin-top: 10px;
  }
`));
