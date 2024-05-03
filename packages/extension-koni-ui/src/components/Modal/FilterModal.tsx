// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Checkbox, Icon, SwModal } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import { FadersHorizontal } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

export type OptionType = {
  label: string,
  value: string,
};

interface Props extends ThemeProps {
  id: string;
  onCancel: () => void;
  title?: string;
  applyFilterButtonTitle?: string;
  onApplyFilter?: () => void;
  optionSelectionMap: Record<string, boolean>;
  options: OptionType[];
  onChangeOption: (value: string, isChecked: boolean) => void;
  closeIcon?: React.ReactNode;
}

function Component (props: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { applyFilterButtonTitle, className = '', closeIcon, id, onApplyFilter, onCancel, onChangeOption, optionSelectionMap, options, title } = props;

  const _onChangeOption = useCallback((e: CheckboxChangeEvent) => {
    onChangeOption(e.target.value as string, e.target.checked);
  }, [onChangeOption]);

  const filterModalFooter = useMemo(() => {
    return (
      <Button
        block={true}
        className={'__apply-button'}
        icon={
          <Icon
            phosphorIcon={FadersHorizontal}
            weight={'bold'}
          />
        }
        onClick={onApplyFilter}
      >
        {applyFilterButtonTitle || t('Apply filter')}
      </Button>
    );
  }, [t, onApplyFilter, applyFilterButtonTitle]);

  return (
    <SwModal
      className={className}
      closeIcon={closeIcon}
      footer={filterModalFooter}
      id={id}
      onCancel={onCancel}
      title={title || t('Filter')}
    >
      <div className={'__options-container'}>
        {
          options.map((option) => (
            <div
              className={'__option-item'}
              key={option.value}
            >
              <Checkbox
                checked={optionSelectionMap[option.value]}
                onChange={_onChangeOption}
                value={option.value}
              >
                <span className={'__option-label'}>{option.label}</span>
              </Checkbox>
            </div>
          ))
        }
      </div>
    </SwModal>
  );
}

export const FilterModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      paddingBottom: token.paddingXS
    },

    '.ant-sw-modal-footer': {
      borderTop: 0
    },

    '.__option-item': {
      display: 'flex'
    },

    '.__option-item + .__option-item': {
      marginTop: token.sizeLG
    },

    '.ant-checkbox-wrapper': {
      display: 'flex',
      alignItems: 'center'
    }
  });
});
