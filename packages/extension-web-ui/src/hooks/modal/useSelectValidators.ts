// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { BasicOnChangeFunction } from '@subwallet/extension-web-ui/components/Field/Base';
import { useNotification, useTranslation } from '@subwallet/extension-web-ui/hooks/common';
import { ValidatorDataType } from '@subwallet/extension-web-ui/types';
import { autoSelectValidatorOptimally, getValidatorKey } from '@subwallet/extension-web-ui/utils';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useMemo, useState } from 'react';

export function useSelectValidators (validatorList: ValidatorDataType[], modalId: string, chain: string, maxCount: number, onChange?: BasicOnChangeFunction, isSingleSelect?: boolean) {
  const notify = useNotification();
  const { t } = useTranslation();

  // Current nominated at init
  const [defaultSelected, setDefaultSelected] = useState<string[]>([]);
  // Current selected validators
  const [selected, setSelected] = useState<string[]>([]);
  // Current chosen in modal
  const [changeValidators, setChangeValidators] = useState<string[]>([]);
  const { inactiveModal } = useContext(ModalContext);

  const fewValidators = maxCount > 1;

  const notiMessage = useMemo(() => {
    const label = getValidatorLabel(chain);

    if (!fewValidators) {
      switch (label) {
        case 'dApp':
          return detectTranslate('You can only choose {{number}} dApp');
        case 'Collator':
          return detectTranslate('You can only choose {{number}} collator');
        case 'Validator':
          return detectTranslate('You can only choose {{number}} validator');
      }
    } else {
      switch (label) {
        case 'dApp':
          return detectTranslate('You can only choose {{number}} dApps');
        case 'Collator':
          return detectTranslate('You can only choose {{number}} collators');
        case 'Validator':
          return detectTranslate('You can only choose {{number}} validators');
      }
    }
  }, [chain, fewValidators]);

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

  const _onApplyChangeValidators = useCallback((_changeValidators: string[]) => {
    onChange && onChange({ target: { value: _changeValidators.join(',') } });
    setSelected(_changeValidators);
    inactiveModal(modalId);
  }, [inactiveModal, modalId, onChange]);

  const onApplyChangeValidators = useCallback(() => {
    _onApplyChangeValidators(changeValidators);
  }, [_onApplyChangeValidators, changeValidators]);

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

  const onAutoSelectValidator = useCallback(() => {
    const validators = autoSelectValidatorOptimally(validatorList, maxCount);
    const validatorKeyList = validators.map((v) => getValidatorKey(v.address, v.identity));

    setChangeValidators(validatorKeyList);
    _onApplyChangeValidators(validatorKeyList);
  }, [_onApplyChangeValidators, maxCount, validatorList]);

  return {
    onChangeSelectedValidator,
    changeValidators,
    onApplyChangeValidators,
    onCancelSelectValidator,
    onInitValidators,
    onAutoSelectValidator
  };
}
