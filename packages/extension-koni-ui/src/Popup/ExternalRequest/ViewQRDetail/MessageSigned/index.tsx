// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import MessageDetail from '@subwallet/extension-koni-ui/Popup/ExternalRequest/ViewQRDetail/MessageSigned/MessageDetail';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

import { isU8a, u8aToHex } from '@polkadot/util';

interface Props extends ThemeProps{
  className?: string;
}

const MessageSigned = (props: Props) => {
  const { className } = props;
  const { state: { dataToSign, isHash, message } } = useContext<ScannerContextType>(ScannerContext);

  return (
    <div className={CN(className)}>
      <MessageDetail
        data={isU8a(dataToSign) ? u8aToHex(dataToSign) : dataToSign}
        isHash={isHash}
        message={message}
      />
    </div>
  );
};

export default React.memo(styled(MessageSigned)(({ theme }: Props) => `

`));
