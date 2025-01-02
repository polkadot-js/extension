// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@polkadot/extension-inject/types';

import React, { useCallback, useContext } from 'react';

import { ActionBar, ActionContext, Button, Link, Table, Warning } from '../../components/index.js';
import { useMetadata, useTranslation } from '../../hooks/index.js';
import { approveMetaRequest, rejectMetaRequest } from '../../messaging.js';
import { styled } from '../../styled.js';

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
      <Table>
        <tr>
          <td className='label'>{t('from')}</td>
          <td className='data'>{url}</td>
        </tr>
        <tr>
          <td className='label'>{t('chain')}</td>
          <td className='data'>{request.chain}</td>
        </tr>
        <tr>
          <td className='label'>{t('icon')}</td>
          <td className='data'>{request.icon}</td>
        </tr>
        <tr>
          <td className='label'>{t('decimals')}</td>
          <td className='data'>{request.tokenDecimals}</td>
        </tr>
        <tr>
          <td className='label'>{t('symbol')}</td>
          <td className='data'>{request.tokenSymbol}</td>
        </tr>
        <tr>
          <td className='label'>{t('upgrade')}</td>
          <td className='data'>{chain ? chain.specVersion : t('<unknown>')} -&gt; {request.specVersion}</td>
        </tr>
      </Table>
      <div className='requestInfo'>
        <Warning className='requestWarning'>
          {t('This approval will add the metadata to your extension instance, allowing future requests to be decoded using this metadata. It will also allow the use of Ledger\'s Generic Polkadot App.')}
        </Warning>
        <Button
          className='btnAccept'
          onClick={_onApprove}
        >
          {t('Yes, do this metadata update')}
        </Button>
        <ActionBar className='btnReject'>
          <Link
            isDanger
            onClick={_onReject}
          >
            {t('Reject')}
          </Link>
        </ActionBar>
      </div>
    </div>
  );
}

export default styled(Request)<Props>`
  .btnAccept {
    margin: 25px auto 0;
    width: 90%;
  }

  .btnReject {
    margin: 8px 0 15px 0;
    text-decoration: underline;
  }

  .icon {
    background: var(--buttonBackgroundDanger);
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

  .requestInfo {
    align-items: center;
    background: var(--highlightedAreaBackground);
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
  }

  .requestWarning {
    margin: 24px 24px 0 1.45rem;
  }
`;
