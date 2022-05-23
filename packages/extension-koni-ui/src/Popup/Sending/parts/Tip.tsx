// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Toggle from '@subwallet/extension-koni-ui/components/Toggle';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';
import InputBalance from "@subwallet/extension-koni-ui/components/InputBalance";

interface Props extends ThemeProps {
  className?: string;
  onChange: (tip: BN) => void;
}

function Tip ({ className, onChange }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [tip, setTip] = useState(BN_ZERO);
  const [showTip, setShowTip] = useState(false);

  useEffect((): void => {
    onChange(showTip ? tip : BN_ZERO);
  }, [onChange, showTip, tip]);

  return (
    <div className={className}>
      <div className={'sending-tip__toggle'}>
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
        <div className={'sending-tip__input-balance'}>
          <InputBalance
            help={t<string>('Add a tip to this extrinsic, paying the block author for greater priority')}
            isZeroable
            label={t<string>('Tip (optional)')}
            onChange={setTip}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(styled(Tip)(() => `
  .sending-tip__toggle {
    display: flex;
    justify-content: flex-end;
  }

  .sending-tip__input-balance {
    margin-top: 10px;
  }
`));
