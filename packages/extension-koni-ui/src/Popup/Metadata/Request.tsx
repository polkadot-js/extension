// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@subwallet/extension-inject/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ActionContext, Button, MenuDivider, Table } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { approveMetaRequest, rejectMetaRequest } from '../../messaging';

interface Props {
  className?: string;
  request: MetadataDef;
  metaId: string;
  url: string;
}

function Request ({ className, metaId, request, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onApprove = useCallback(
    (): void => {
      approveMetaRequest(metaId)
        .then(() => onAction())
        .catch(console.error);
    },
    [metaId, onAction]
  );

  const _onReject = useCallback(
    (): void => {
      rejectMetaRequest(metaId)
        .then(() => onAction())
        .catch(console.error);
    },
    [metaId, onAction]
  );

  return (
    <div className={className}>
      <div className='metadata-content'>
        <div className='metadata-title'>{t<string>('Your metadata is out of date')}</div>
        <div className='metadata-text'>
          {`Approving this update will sync your metadata for the ${request.chain} chain from ${url}`}
        </div>
      </div>
      <MenuDivider className='metadata-divider' />
      <div className='request-wrapper'>
        <Table>
          <tr>
            <td className='label'>{t<string>('Symbol')}</td>
            <td className='data'>{request.tokenSymbol}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('Decimals')}</td>
            <td className='data'>{request.tokenDecimals}</td>
          </tr>
        </Table>
      </div>

      <div className='metadata-request__request-info'>
        <Button
          className='metadata-request__btn'
          onClick={_onReject}
        >
          <span>{t<string>('Cancel')}</span>
        </Button>
        <Button
          className='metadata-request__btn'
          onClick={_onApprove}
        >
          {t<string>('Approve')}
        </Button>
      </div>
    </div>
  );
}

export default styled(Request)(({ theme }: ThemeProps) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;

  .metadata-request__btn {
    flex: 1;
  }

  .metadata-request__btn:first-child {
    background-color: #181E42;
    margin-right: 8px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .metadata-request__btn:last-child {
    margin-left: 8px;
  }

  .request-wrapper {
    padding: 16px 70px 0;
  }

  .metadata-divider {
    border-bottom-width: 1px;
  }

  .metadata-request__request-info {
    align-items: center;
    display: flex;
    margin: 0 15px;
    position: sticky;
    bottom: -15px;
    margin-left: -15px;
    margin-right: -15px;
    margin-bottom: -15px;
    padding: 15px;
    background-color: ${theme.background};
  }

  .metadata-title {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    text-align: center;
    padding-bottom: 10px;
  }

  .metadata-text {
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    text-align: center;
    padding: 0 30px 25px;
  }

  .label, .data {
    font-size: 14px;
    line-height: 26px;
  }
`);
