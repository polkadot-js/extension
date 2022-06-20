// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  confirmation: ConfirmationsQueue['evmSignatureRequest'][0];
}

function EvmSignConfirmationInfo ({ className, confirmation: { payload } }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [signMethod, setSignMethod] = useState('');
  const [rawData, setRawData] = useState<string>('');
  const [warning, setWarning] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (payload.type === 'eth_sign') {
      setWarning('Signing this message can be dangerous. This signature could potentially perform any operation on your account\'s behalf, including granting complete control of your account and all of its assets to the requesting site. Only sign this message if you know what you\'re doing or completely trust the requesting site.');
      setSignMethod('ETH Sign');
    } else if (payload.type === 'personal_sign') {
      setSignMethod('Personal Sign');
    } else if (payload.type === 'eth_signTypedData') {
      setSignMethod('Sign Typed Data');
    } else if (payload.type === 'eth_signTypedData_v1') {
      setSignMethod('Sign Typed Data V1');
    } else if (payload.type === 'eth_signTypedData_v3') {
      setSignMethod('Sign Typed Data V3');
    } else if (payload.type === 'eth_signTypedData_v4') {
      setSignMethod('Sign Typed Data V4');
    }

    const raw = typeof payload.payload === 'string' ? payload.payload : JSON.stringify(payload.payload, null, 2);

    setRawData(raw);
  }, [payload]);

  return <div className={className}>
    <div className='signature-wrapper'>
      <div>
        <span className='label'>{t<string>('Sign Method')}</span><span className='value'>{signMethod}</span>
      </div>
      {warning && <div className='value warning-message'>{warning}</div>}
      <div>
        <span className='label'>{t<string>('Raw Data')}</span>
        <div className='pre-wrap'>{rawData}</div>
      </div>
    </div>
  </div>;
}

export default styled(EvmSignConfirmationInfo)(({ theme }: Props) => `
  .signature-wrapper {
    position: relative;
    width: 100%;  
  }
  
  .label {
    font-weight: bold;
    padding-right: 8px;
  }
  .warning-message {
    color: red;
  }
  
  .pre-wrap {
    color: #7B8098;
    display: block;
    white-space: pre-wrap;
    width: 100%;
    overflow: auto;
  }
`);
