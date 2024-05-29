// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from 'react';

const TOKENS_PER_PAGE = 10;

export function useLazyList<T> (items: T[], forceReload = true) {
  const [lazyItems, setLazyItems] = useState<T[]>([]);
  const [paging, setPaging] = useState(TOKENS_PER_PAGE);

  useEffect(() => {
    if (forceReload) {
      setLazyItems(items.slice(0, TOKENS_PER_PAGE));
      setPaging(TOKENS_PER_PAGE);
    } else {
      setLazyItems((prevState) => {
        if (prevState.length) {
          return prevState;
        } else {
          return items.slice(0, TOKENS_PER_PAGE);
        }
      });
    }
  }, [items, forceReload]);

  const hasMore = useMemo(() => {
    return items.length > lazyItems.length;
  }, [items.length, lazyItems.length]);

  const loadMoreItems = useCallback(() => {
    setTimeout(() => {
      if (hasMore) {
        const nextPaging = paging + TOKENS_PER_PAGE;
        const to = nextPaging > items.length ? items.length : nextPaging;

        setLazyItems(items.slice(0, to));
        setPaging(nextPaging);
      }
    }, 50);
  }, [hasMore, items, paging]);

  return {
    lazyItems,
    hasMore,
    loadMoreItems
  };
}
