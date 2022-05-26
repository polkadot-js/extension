// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { unwrapMessage } from '@subwallet/extension-koni-ui/util/scanner';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { hexToString, isAscii } from '@polkadot/util';

interface Props extends ThemeProps{
  className?: string;
  isHash: boolean;
  message: string;
  data: string;
}

const MessageDetail = (props: Props) => {
  const { className, data, isHash, message } = props;
  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      <div className={CN('label')}>
        {isHash ? t('Message Hash') : t('Message')}:
      </div>
      {
        isHash
          ? <div className={CN('text')}>{message}</div>
          : <div className={CN('text')}>
            {isAscii(message) ? unwrapMessage(hexToString(message)) : data}
          </div>
      }
    </div>
  );
};

export default React.memo(styled(MessageDetail)(({ theme }: Props) => `
  margin-top: 8px;
  padding: 5px;

  .label{

  }

  .text{
    overflow-wrap: break-word;
    color: ${theme.textColor2};
    font-size: 12px;
  }
`));
