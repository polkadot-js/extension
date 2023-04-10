// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicOnChangeFunction } from '@subwallet/extension-koni-ui/components/Field/Base';
import { useNotification } from '@subwallet/extension-koni-ui/hooks';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useState } from 'react';

export function useSelectValidators (modalId: string, maxCount: number, onChange?: BasicOnChangeFunction, isSingleSelect?: boolean) {
  const notify = useNotification();

  // Current nominated at init
  const [defaultSelected, setDefaultSelected] = useState<string[]>([]);
  // Current selected validators
  const [selected, setSelected] = useState<string[]>([]);
  // Current chosen in modal
  const [changeValidators, setChangeValidators] = useState<string[]>([]);
  const { inactiveModal } = useContext(ModalContext);

  const onChangeSelectedValidator = useCallback((changeVal: string) => {
    setChangeValidators((changeValidators) => {
      let result: string[];

      if (!changeValidators.includes(changeVal)) {
        if (isSingleSelect) {
          if (defaultSelected.length >= maxCount) {
            if (!defaultSelected.includes(changeVal)) {
              notify({
                message: `You can only choose ${maxCount} validators`,
                type: 'info'
              });

              return changeValidators;
            }
          }

          result = [changeVal];
        } else {
          if (changeValidators.length >= maxCount) {
            notify({
              message: `You can only choose ${maxCount} validators`,
              type: 'info'
            });

            return changeValidators;
          }

          result = [...changeValidators, changeVal];
        }
      } else {
        if (isSingleSelect) {
          result = [];
        } else {
          result = changeValidators.filter((item) => item !== changeVal);
        }
      }

      return result;
    });
  }, [defaultSelected, isSingleSelect, maxCount, notify]);

  const onApplyChangeValidators = useCallback(() => {
    onChange && onChange({ target: { value: changeValidators.join(',') } });

    setSelected(changeValidators);
    inactiveModal(modalId);
  }, [changeValidators, inactiveModal, modalId, onChange]);

  const onCancelSelectValidator = useCallback(() => {
    setChangeValidators(selected);
    inactiveModal(modalId);
  }, [selected, inactiveModal, modalId]);

  const onInitValidators = useCallback((defaultValue: string, selected: string) => {
    const _selected = !selected ? [] : selected.split(',');
    const _default = !defaultValue ? [] : defaultValue.split(',');

    setChangeValidators(_selected);
    setDefaultSelected(_default);
    setSelected(_selected);
  }, []);

  return {
    onChangeSelectedValidator,
    changeValidators,
    onApplyChangeValidators,
    onCancelSelectValidator,
    onInitValidators
  };
}
