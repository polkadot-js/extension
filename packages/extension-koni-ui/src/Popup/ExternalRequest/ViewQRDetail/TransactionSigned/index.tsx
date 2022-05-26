// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import PayloadDetail from '@subwallet/extension-koni-ui/Popup/ExternalRequest/ViewQRDetail/TransactionSigned/PayloadDetail';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  network: NetWorkInfo;
  setButtonLoading: (value: boolean) => void;
}

const TransactionSigned = (props: Props) => {
  const { className, network, setButtonLoading } = props;
  // eslint-disable-next-line no-empty-pattern
  const { state: { } } = useContext<ScannerContextType>(ScannerContext);

  return (
    <div className={CN(className)}>
      {
        network.isEthereum
          ? (
            <></>
          )
          : (
            <PayloadDetail
              network={network}
              setButtonLoading={setButtonLoading}
            />
          )
      }
    </div>
  );
};

export default React.memo(styled(TransactionSigned)(({ theme }: Props) => `
`));
