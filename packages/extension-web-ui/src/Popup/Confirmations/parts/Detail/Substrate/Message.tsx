// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from '@subwallet/extension-web-ui/components/MetaInfo/MetaInfo';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
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
    <MetaInfo className={CN(className)}>
      <MetaInfo.Data label={t('Raw data')}>
        {bytes}
      </MetaInfo.Data>
      <MetaInfo.Data label={t('Message')}>
        {message}
      </MetaInfo.Data>
    </MetaInfo>
  );
};

const SubstrateMessageDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default SubstrateMessageDetail;
