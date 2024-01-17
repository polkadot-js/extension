// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useState } from 'react';

export function useFilterModal (modalId: string) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterSelectionMap, setFilterSelectionMap] = useState<Record<string, boolean>>({});
  const { inactiveModal } = useContext(ModalContext);

  const onCloseFilterModal = useCallback(() => {
    setFilterSelectionMap(selectedFilters.reduce((acc, curr) => {
      acc[curr] = true;

      return acc;
    }, {} as Record<string, boolean>));
    inactiveModal(modalId);
  }, [inactiveModal, modalId, selectedFilters]);

  const onChangeFilterOption = useCallback((value: string, isCheck: boolean) => {
    setFilterSelectionMap((prev) => ({
      ...prev,
      [value]: isCheck
    }));
  }, []);

  const onApplyFilter = useCallback(() => {
    inactiveModal(modalId);
    setSelectedFilters(Object.keys(filterSelectionMap).filter((o) => filterSelectionMap[o]));
  }, [filterSelectionMap, inactiveModal, modalId]);

  const onResetFilter = useCallback(() => {
    setSelectedFilters([]);
    setFilterSelectionMap((prevState) => {
      const result = { ...prevState };

      for (const key of Object.keys(result)) {
        result[key] = false;
      }

      return result;
    });
  }, []);

  return {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    onResetFilter,
    selectedFilters
  };
}
