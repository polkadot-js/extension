// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useState } from 'react';

export function useFilterModal<T> (items: T[], modalId: string) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [changeFilters, setChangeFilters] = useState<string[]>(selectedFilters);
  const { inactiveModal } = useContext(ModalContext);

  const onChangeFilterOpt = useCallback((value: string, isCheck: boolean) => {
    if (isCheck) {
      setChangeFilters([...changeFilters, value]);
    } else {
      const newSelectedFilters: string[] = [];

      changeFilters.forEach((filterVal) => {
        if (filterVal !== value) {
          newSelectedFilters.push(filterVal);
        }
      });
      setChangeFilters(newSelectedFilters);
    }
  }, [changeFilters]);

  const onApplyFilter = useCallback(() => {
    inactiveModal(modalId);
    setSelectedFilters(changeFilters);
  }, [changeFilters, inactiveModal, modalId]);

  return {
    onChangeFilterOpt,
    onApplyFilter,
    changeFilters,
    selectedFilters
  };
}
