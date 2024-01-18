// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { EarningEntryParam, EarningEntryView, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { Plus } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onBack = useCallback(() => {
    navigate('/home/earning', { state: {
      view: EarningEntryView.POSITIONS
    } as EarningEntryParam });
  }, [navigate]);

  const subHeaderButtons: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: (
          <Icon
            phosphorIcon={Plus}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: () => {
          //
        }
      }
    ];
  }, []);

  return (
    <Layout.Base
      className={CN(className)}
      onBack={onBack}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
      subHeaderIcons={subHeaderButtons}
      subHeaderPaddingVertical={true}
      title={t<string>('Earning position detail')}
    >
      Content here
    </Layout.Base>
  );
}

const EarningPositionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));

export default EarningPositionDetail;
