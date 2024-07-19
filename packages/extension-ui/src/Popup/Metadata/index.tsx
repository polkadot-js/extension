// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';

import { Loading, MetadataReqContext, RawMetadataReqContext } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { Header } from '../../partials/index.js';
import Request from './Request.js';

export default function Metadata (): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(MetadataReqContext);
  const rawRequests = useContext(RawMetadataReqContext)
    
  return (
    <>
      <Header text={t('Metadata')} />
      {requests[0]
        ? (
          <Request
            key={requests[0].id}
            metaId={requests[0].id}
            request={requests[0].request}
            rawRequest={rawRequests[0].id}
            url={requests[0].url}
          />
        )
        : <Loading />
      }
    </>
  );
}
