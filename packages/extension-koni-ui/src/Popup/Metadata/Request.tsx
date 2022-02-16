// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@polkadot/extension-inject/types';
import type { ThemeProps } from '../../types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';
import { ActionBar, ActionContext, Button, Link, Table, Warning } from '../../components';
import useMetadata from '../../hooks/useMetadata';
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
  const chain = useMetadata(request.genesisHash);
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
      <div className='request-wrapper'>
        <Table>
          <tr>
            <td className='label'>{t<string>('from')}</td>
            <td className='data'>{url}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('chain')}</td>
            <td className='data'>{request.chain}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('icon')}</td>
            <td className='data'>{request.icon}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('decimals')}</td>
            <td className='data'>{request.tokenDecimals}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('symbol')}</td>
            <td className='data'>{request.tokenSymbol}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('upgrade')}</td>
            <td className='data'>{chain ? chain.specVersion : t('<unknown>')} -&gt; {request.specVersion}</td>
          </tr>
        </Table>
        <Warning>
          {t<string>('This approval will add the metadata to your extension instance, allowing future requests to be decoded using this metadata.')}
        </Warning>
      </div>

      <div className='metadata-request__request-info'>
        <Button
          onClick={_onApprove}
        >
          {t<string>('Yes, do this metadata update')}
        </Button>
        <ActionBar className='metadata-request__reject-btn'>
          <Link
            isDanger
            onClick={_onReject}
          >
            {t<string>('Reject')}
          </Link>
        </ActionBar>
      </div>
    </div>
  );
}

export default styled(Request)(({ theme }: ThemeProps) => `
  padding: 25px 15px 15px;
  flex: 1;
  margin-top: -25px;
  overflow-y: auto;

  .metadata-request__reject-btn {
    margin-top: 8px;
  }

  .icon {
    background: ${theme.buttonBackgroundDanger};
    color: white;
    min-width: 18px;
    width: 14px;
    height: 18px;
    font-size: 10px;
    line-height: 20px;
    margin: 16px 15px 0 1.35rem;
    font-weight: 800;
    padding-left: 0.5px;
  }

  .metadata-request__request-info {
    align-items: center;
    display: flex;
    flex-direction: column;
    margin: 0 15px;
    position: sticky;
    bottom: -15px;
    margin-left: -15px;
    margin-right: -15px;
    margin-bottom: -15px;
    padding: 15px;
    background-color: ${theme.background};
  }
`);
