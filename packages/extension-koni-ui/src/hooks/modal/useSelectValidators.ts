// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicOnChangeFunction } from '@subwallet/extension-koni-ui/components/Field';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { useCallback, useContext, useState } from 'react';

export function useSelectValidators<T> (items: T[], modalId: string, defaultSelectedValidators: string[], onChange?: BasicOnChangeFunction<T>) {
  const [selectedValidators, setSelectedValidators] = useState<string[]>(defaultSelectedValidators);
  const [changeValidators, setChangeValidators] = useState<string[]>(selectedValidators);
  const { inactiveModal } = useContext(ModalContext);

  const onChangeSelectedValidator = useCallback((value: string) => {
    if (!changeValidators.includes(value)) {
      setChangeValidators([...changeValidators, value]);
    } else {
      const newSelectedFilters: string[] = [];

      changeValidators.forEach((changeVal) => {
        if (changeVal !== value) {
          newSelectedFilters.push(changeVal);
        }
      });
      setChangeValidators(newSelectedFilters);
    }
  }, [changeValidators]);

  const onApplyChangeValidators = useCallback(() => {
    onChange && onChange({ target: { value: changeValidators.join(',') } });
    setSelectedValidators(changeValidators);
    inactiveModal(modalId);
  }, [changeValidators, inactiveModal, modalId, onChange]);

  const onCancelSelectValidator = useCallback(() => {
    setChangeValidators(selectedValidators);
    inactiveModal(modalId);
  }, [inactiveModal, modalId, selectedValidators]);

  return {
    onChangeSelectedValidator,
    onApplyChangeValidators,
    changeValidators,
    onCancelSelectValidator
  };
}
