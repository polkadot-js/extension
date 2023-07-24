// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled from 'styled-components';

import useRequestsPagination from '@polkadot/extension-ui/hooks/useRequestsPagination';

import { Hero, Loading, MetadataReqContext, RequestPagination } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Request from './Request';

export default function Metadata(): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(MetadataReqContext);
  const { index: requestIndex, next, previous, request } = useRequestsPagination(requests);

  const isOneRemaining = requests.length === 1;

  return (
    <>
      {!isOneRemaining && (
        <StyledRequestPagination
          index={requestIndex}
          onNextClick={next}
          onPreviousClick={previous}
          pluralName={t<string>('metadata updates')}
          singularName={t<string>('metadata update')}
          totalItems={requests.length}
        />
      )}
      <StyledHero
        headerText={t('Metadata update')}
        iconType='warning'
      >
        {t('This approval enables future requests to be decoded using this metadata.')}
      </StyledHero>
      {request ? (
        <Request
          isLast={isOneRemaining}
          key={request.id}
          metaId={request.id}
          request={request.payload}
          url={request.url}
        />
      ) : (
        <Loading />
      )}
    </>
  );
}

const StyledHero = styled(Hero)`
  margin-inline: 40px;
  margin-block: auto;
`;

const StyledRequestPagination = styled(RequestPagination)`
  margin-inline: 16px;
`;
