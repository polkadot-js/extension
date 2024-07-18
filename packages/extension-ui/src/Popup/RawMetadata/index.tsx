// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';

import { Loading, RawMetadataReqContext } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { Header } from '../../partials/index.js';
import Request from './Request.js';

export default function RawMetadata (): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(RawMetadataReqContext);

  return (
    <>
      <Header text={t('Metadata')} />
      {requests[0]
        ? (
          <Request
            key={requests[0].id}
            metaId={requests[0].id}
            request={requests[0].request}
            url={requests[0].url}
          />
        )
        : <Loading />
      }
    </>
  );
}
