// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';

import { Loading, MetadataReqContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Request from './Request';

export default function Metadata (): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(MetadataReqContext);

  return (
    <>
      <Header
        showSubHeader
        subHeaderName={t<string>('Metadata')}
      />
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
