// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isAscii, u8aToString, u8aUnwrapBytes } from '@polkadot/util';

interface Props extends ThemeProps {
  bytes: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { bytes, className } = props;

  const { t } = useTranslation();

  const message = useMemo(
    () => isAscii(bytes)
      ? u8aToString(u8aUnwrapBytes(bytes))
      : bytes,
    [bytes]
  );

  return (
    <div className={CN(className)}>
      <div className='data-container'>
        <div className='data-title'>
          {t('Raw data')}
        </div>
        <div className='data-value'>
          {bytes}
        </div>
      </div>
      <div className='data-container'>
        <div className='data-title'>
          {t('Message')}
        </div>
        <div className='data-value'>
          {message}
        </div>
      </div>
    </div>
  );
};

const SubstrateMessageDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: token.size
  };
});

export default SubstrateMessageDetail;
