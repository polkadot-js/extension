// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { FilterModal, SortingModal } from '@subwallet/extension-koni-ui/components';
import EarningBtn from '@subwallet/extension-koni-ui/components/EarningBtn';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Button, Icon, ModalContext, Typography } from '@subwallet/react-ui';
import { ButtonType } from '@subwallet/react-ui/es/button';
import { CaretDown, FadersHorizontal, IconProps, Question, SortAscending } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  filterSelectionMap: Record<string, boolean>;
  onApplyFilter: () => void;
  onChangeFilterOption: (value: string, isCheck: boolean) => void
  onCloseFilterModal: () => void;
  selectedFilters: string[];
  onChangeSortOpt: (value: string) => void;
  onResetSort: () => void
}

const FILTER_MODAL_ID = 'earning-filter-modal';
const SORTING_MODAL_ID = 'earning-sorting-modal';

enum SortKey {
  TOTAL_VALUE = 'total-value',
}

interface SortOption {
  label: string;
  value: SortKey;
  desc: boolean;
}

interface ToolbarBtnProps extends ThemeProps {
  icon: React.ReactNode;
  label?: string;
  type?: ButtonType;
  onClick: () => void;
}

function _ToolbarBtn ({ className, icon, label, onClick, type }: ToolbarBtnProps): React.ReactElement<ToolbarBtnProps> {
  const { token } = useTheme() as Theme;

  return (
    <Button
      icon={icon}
      onClick={onClick}
      schema='secondary'
      shape={'round'}
      size={'xs'}
      type={type}
    >
      <div className={className}>
        <Typography.Text>{label}</Typography.Text>
        <Icon
          className={'earning-filter-icon'}
          customSize={'12px'}
          iconColor={token.colorTextLight4}
          phosphorIcon={CaretDown}
          weight={'bold'}
        />
      </div>
    </Button>
  );
}

const ToolbarBtn = styled(_ToolbarBtn)<ToolbarBtnProps>(({ theme: { token } }: ToolbarBtnProps) => {
  return ({
    display: 'flex',
    gap: token.paddingXS,
    alignItems: 'center',
    paddingLeft: token.paddingXS,

    '.earning-filter-icon': {
      width: '12px',
      height: '12px'
    }

  });
});

function Component ({ className = '', filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { activeModal } = useContext(ModalContext);
  const filterOptions = useMemo(() => [
    { label: t('Nomination pool'), value: YieldPoolType.NOMINATION_POOL },
    { label: t('Native staking'), value: YieldPoolType.NATIVE_STAKING },
    { label: t('Liquid staking'), value: YieldPoolType.LIQUID_STAKING },
    { label: t('Lending'), value: YieldPoolType.LENDING },
    { label: t('Parachain staking'), value: YieldPoolType.PARACHAIN_STAKING },
    { label: t('Single farming'), value: YieldPoolType.SINGLE_FARMING }
  ], [t]);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.TOTAL_VALUE);

  const sortingOptions: SortOption[] = useMemo(() => {
    return [
      {
        desc: true,
        label: t('Sort by total value'),
        value: SortKey.TOTAL_VALUE
      }
    ];
  }, [t]);

  const filterLabel = useMemo(() => {
    if (!selectedFilters.length) {
      return t('All type');
    } else {
      if (selectedFilters.length === 1) {
        return filterOptions.find((opt) => opt.value === selectedFilters[0])?.label;
      } else {
        return t(`${selectedFilters.length} selected`);
      }
    }
  }, [selectedFilters, filterOptions, t]);

  const sortingLabel = useMemo(() => {
    return sortingOptions.find((item) => item.value === sortSelection)?.label || '';
  }, [selectedFilters, filterOptions, t]);

  const openFilterModal = useCallback(() => activeModal(FILTER_MODAL_ID), []);
  const openSortingModal = useCallback(() => activeModal(SORTING_MODAL_ID), []);
  const onClickHelpBtn = useCallback(() => {}, []);

  const onChangeSortOpt = useCallback((value: string) => {
    setSortSelection(value as SortKey);
  }, []);

  const onResetSort = useCallback(() => {
    setSortSelection(SortKey.TOTAL_VALUE);
  }, []);

  const renderIconBtn = useCallback((icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>) => (
    <BackgroundIcon
      backgroundColor={token.colorTextLight4}
      iconColor={token.colorWhite}
      phosphorIcon={icon}
      size={'sm'}
    />
  ), []);

  return (
    <div className={className}>
      <div>
        <EarningBtn
          network={'polkadot'}
          size={'xs'}
        >
          {'DOT'}
        </EarningBtn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: token.paddingXS }}>
        <ToolbarBtn
          icon={
            <Icon
              iconColor={token.colorTextLight4}
              phosphorIcon={Question}
              weight={'duotone'}
            />
          }
          label={t('Help')}
          onClick={onClickHelpBtn}
          type={'ghost'}
        />
        <ToolbarBtn
          icon={renderIconBtn(FadersHorizontal)}
          label={filterLabel}
          onClick={openFilterModal}
        />
        <ToolbarBtn
          icon={renderIconBtn(SortAscending)}
          label={sortingLabel}
          onClick={openSortingModal}
        />
      </div>

      <FilterModal
        applyFilterButtonTitle={t('Apply filter')}
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
        title={t('Filter')}
      />

      <SortingModal
        id={SORTING_MODAL_ID}
        onChangeOption={onChangeSortOpt}
        onReset={onResetSort}
        optionSelection={sortSelection}
        options={sortingOptions}
      />
    </div>
  );
}

const EarningToolbar = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: token.padding,

    '.earning-filter-icon': {
      width: '12px',
      height: '12px'
    }

  });
});

export default EarningToolbar;
