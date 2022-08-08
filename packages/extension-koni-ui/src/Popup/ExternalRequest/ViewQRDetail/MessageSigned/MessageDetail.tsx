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
  signature: string;
}

const MessageDetail = (props: Props) => {
  const { className, data, isHash, message, signature } = props;
  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      <div className={CN('info-group-container')}>
        <div className={CN('group-title')}>
          Basic
        </div>
        <table
          cellPadding={0}
          cellSpacing={4}
          className={CN('group-body')}
        >
          <tbody>
            <tr className={'info-container'}>
              <td className={CN('info-title')}>
                {t('Signature')}:
              </td>
              <td
                className={CN('info-detail')}
                colSpan={3}
              >
                {
                  isHash
                    ? <div className={CN('text')}>{message}</div>
                    : <div className={CN('text')}>
                      {isAscii(message) ? unwrapMessage(hexToString(message)) : data}
                    </div>
                }
              </td>
            </tr>
            <tr className={'info-container'}>
              <td className={CN('info-title')}>
                {isHash ? t('Message Hash') : t('Message')}:
              </td>
              <td
                className={CN('info-detail')}
                colSpan={3}
              >
                {signature}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(styled(MessageDetail)(({ theme }: Props) => `
  margin-top: 16px;

  .info-group-container {
    .group-title {
      font-style: normal;
      font-weight: 700;
      font-size: 14px;
      line-height: 26px;
      text-align: left;
      color: ${theme.primaryColor}
    }

    .group-body {
      border-spacing: 4px;
      margin-left: -4px;

        .info-container{

          .info-title{
            color: ${theme.textColor2};
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 26px;
            text-align: left;
            white-space: nowrap;
            vertical-align: top;
          }

          .info-detail{
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 26px;
            color: ${theme.textColor};
            text-align: left;
            word-break: break-word;
            vertical-align: top;
            min-width: 90px;

            &:nth-child(4) {
              text-align: right;
            }
          }
        }
    }
  }
`));
