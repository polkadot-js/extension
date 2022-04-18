// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';

import InputAddress from './InputAddress';

interface Props {
  className: string;
  setRecipientId: (id: string | null) => void;
}

function getShortenText (text: string, cut = 6) {
  return `${text.slice(0, cut)}…${text.slice(-cut)}`;
}

function ReceiverInputAddress ({ className = '', setRecipientId }: Props): React.ReactElement {
  const { t } = useTranslation();
  const currentAccount = useSelector((state: RootState) => state.currentAccount.account);
  const { isEthereum, networkPrefix } = useSelector((state: RootState) => state.currentNetwork);
  const [value, setInputAddressValue] = useState<string | undefined>('');
  let formattedAddress = '';

  if (value && value !== '-') {
    formattedAddress = reformatAddress(value, networkPrefix, isEthereum);
  }

  return (
    <div className={className}>
      <InputAddress
        autoPrefill={false}
        className={'send-fund-item'}
        help={t<string>('Select a contact or paste the address you want to send funds to.')}
        isEthereum={currentAccount?.type === 'ethereum'}
        isSetDefaultValue={false}
        label={t<string>('Send to address')}
        // isDisabled={!!propRecipientId}
        onChange={setRecipientId}
        setInputAddressValue={setInputAddressValue}
        type='allPlus'
        withEllipsis
      />

      <div className='receiver-input-address__balance'>
        1.0000 ACA
      </div>

      <div className='receiver-input-address__address'>
        {formattedAddress ? getShortenText(formattedAddress, 6) : ''}
      </div>
    </div>
  );
}

export default styled(ReceiverInputAddress)(({ theme }: ThemeProps) => `
  border: 2px solid ${theme.boxBorderColor};
  height: 72px;
  border-radius: 8px;
  position: relative;

  .receiver-input-address__address {
    position: absolute;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    right: 16px;
    top: 32px;
    pointer-events: none;
  }

  .receiver-input-address__balance {
    position: absolute;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    right: 16px;
    top: 8px;
    pointer-events: none;
  }
`);
