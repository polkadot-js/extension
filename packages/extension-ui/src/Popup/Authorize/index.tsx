// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AuthorizeReqContext } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { Header } from '../../partials/index.js';
import { styled } from '../../styled.js';
import Request from './Request.js';

interface Props {
  className?: string;
}

function Authorize ({ className = '' }: Props): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(AuthorizeReqContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (requests.length <= currentIndexRef.current) {
      setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    }
  }, [requests.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = Math.min(prevIndex + 1, requests.length - 1);

      currentIndexRef.current = newIndex;

      return newIndex;
    });
  }, [requests.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = Math.max(prevIndex - 1, 0);

      currentIndexRef.current = newIndex;

      return newIndex;
    });
  }, []);

  return (
    <div className={`${className}`}>
      <Header
        smallMargin={true}
        text={t('Account connection request')}
      />
      {requests.length > 1 && (
        <div className='pagination'>
          <button
            className={currentIndex === 0 ? 'hidden' : ''}
            onClick={handlePrevious}
          >
            {t('Previous')}
          </button>
          <span>{`${currentIndex + 1} / ${requests.length}`}</span>
          <button
            className={currentIndex === requests.length - 1 ? 'hidden' : ''}
            onClick={handleNext}
          >
            {t('Next')}
          </button>
        </div>
      )}
      {requests.length > 0 && requests[currentIndex] && (
        <Request
          authId={requests[currentIndex].id}
          className='request'
          key={requests[currentIndex].id}
          request={requests[currentIndex].request}
          url={requests[currentIndex].url}
        />
      )}
    </div>
  );
}

export default styled(Authorize)<Props>`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;

  && {
    padding: 0;
  }

  .request {
    padding: 0 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
    min-height: 400px;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    background: var(--background);

    button {
      background: none;
      border: none;
      color: var(--textColor);
      cursor: pointer;
      padding: 0.5rem 1rem;

      &.hidden {
        visibility: hidden;
      }
    }

    span {
      align-self: center;
    }
  }
`;
