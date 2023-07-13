// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { BasicOnChangeFunction } from '@subwallet/extension-koni-ui/components/Field/Base';
import { useNotification, useTranslation } from '@subwallet/extension-koni-ui/hooks/common';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useMemo, useState } from 'react';

export function useSelectValidators (modalId: string, chain: string, maxCount: number, onChange?: BasicOnChangeFunction, isSingleSelect?: boolean) {
  const notify = useNotification();
  const { t } = useTranslation();

  // Current nominated at init
  const [defaultSelected, setDefaultSelected] = useState<string[]>([]);
  // Current selected validators
  const [selected, setSelected] = useState<string[]>([]);
  // Current chosen in modal
  const [changeValidators, setChangeValidators] = useState<string[]>([]);
  const { inactiveModal } = useContext(ModalContext);

  const notiMessage = useMemo(() => {
    const label = getValidatorLabel(chain);

    switch (label) {
      case 'dApp':
        return detectTranslate('You can only choose {number, plural, =0 {# dApp} =1 {# dApp} other {# dApps}}');
      case 'Collator':
        return detectTranslate('You can only choose {number, plural, =0 {# collator} =1 {# collator} other {# collators}}');
      case 'Validator':
        return detectTranslate('You can only choose {number, plural, =0 {# validator} =1 {# validator} other {# validators}}');
    }
  }, [chain]);

  const onChangeSelectedValidator = useCallback((changeVal: string) => {
    setChangeValidators((changeValidators) => {
      let result: string[];

      if (!changeValidators.includes(changeVal)) {
        if (isSingleSelect) {
          if (defaultSelected.length >= maxCount) {
            if (!defaultSelected.includes(changeVal)) {
              notify({
                message: t(notiMessage, { replace: { number: maxCount } }),
                type: 'info'
              });

              return changeValidators;
            }
          }

          result = [changeVal];
        } else {
          if (changeValidators.length >= maxCount) {
            notify({
              message: t(notiMessage, { replace: { number: maxCount } }),
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
  }, [notiMessage, defaultSelected, isSingleSelect, maxCount, notify, t]);

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
