// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { toShort } from '@polkadot/extension-koni-ui/util';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';

import InputAddress from './InputAddress';

interface Props {
  networkKey: string;
  className: string;
  setRecipientId: (id: string) => void;
}

function ReceiverInputAddress ({ className = '', networkKey, setRecipientId }: Props): React.ReactElement {
  const { t } = useTranslation();
  const networkPrefix = NETWORKS[networkKey].ss58Format;
  const [receiveAddress, setReceiveAddress] = useState<string>('');

  const formattedAddress = useMemo<string>(() => {
    if (receiveAddress) {
      return reformatAddress(receiveAddress, networkPrefix);
    }

    return '';
  }, [receiveAddress, networkPrefix]);

  const onChangeReceiveAddress = useCallback((address: string) => {
    setRecipientId(address);
    setReceiveAddress(address);
  }, [setRecipientId]);

  return (
    <div className={className}>
      <InputAddress
        autoPrefill={false}
        className={'send-fund-item'}
        help={t<string>('Select a contact or paste the address you want to send funds to.')}
        isSetDefaultValue={false}
        label={t<string>('Send to address')}
        // isDisabled={!!propRecipientId}
        onChange={onChangeReceiveAddress}
        type='allPlus'
        withEllipsis
      />

      <div className='receiver-input-address__balance'>
        1.0000 ACA
      </div>

      <div className='receiver-input-address__address'>
        {toShort(formattedAddress)}
      </div>
    </div>
  );
}

export default styled(ReceiverInputAddress)(({ theme }: ThemeProps) => `
  border: 2px solid ${theme.boxBorderColor};
  height: 72px;
  border-radius: 8px;
  position: relative;
  margin-bottom: 10px;

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
