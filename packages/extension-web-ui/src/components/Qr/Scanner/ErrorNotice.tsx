// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon } from '@subwallet/react-ui';
import { XCircle } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  message: string;
}

const Component: React.FC<Props> = ({ className, message }: Props) => {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div className='content'>
        <Icon
          className='icon'
          phosphorIcon={XCircle}
          size='sm'
        />
        <div>{t(message)}</div>
      </div>
    </div>
  );
};

const QrScannerErrorNotice = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',

    '.content': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXS,
      backgroundColor: token.colorBgLayout,
      borderRadius: token.borderRadiusLG,
      borderWidth: token.lineWidth * 2,
      borderStyle: token.lineType,
      borderColor: token.colorError,
      padding: `${token.paddingXS}px ${token.padding}px`,

      '.icon': {
        color: token.colorError
      }
    }
  };
});

export default QrScannerErrorNotice;
