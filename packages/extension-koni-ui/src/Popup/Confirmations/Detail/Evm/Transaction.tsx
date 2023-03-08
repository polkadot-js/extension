// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {

}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      {/* Empty */}
    </div>
  );
};

const EvmTransactionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default EvmTransactionDetail;
