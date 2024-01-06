// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

export type InstructionContentType = {
  type?: 'info' | 'warning';
  title: string;
  description: string | React.ReactElement;
}

type PropsType = ThemeProps & {
  className?: string
  contents: InstructionContentType[]
}

const Component: React.FC<PropsType> = ({ className, contents }: PropsType) => {
  const { t } = useTranslation();

  if (contents.length <= 0) {
    return <></>;
  }

  return (
    <div className={CN('instruction-container', className)}>
      {
        contents.map((alert: InstructionContentType, index: number) => (
          <AlertBox
            description={typeof alert.description === 'string' ? t(alert.description) : alert.description}
            key={index}
            title={t(alert.title)}
            className={'__alert-box'}
            type={alert.type || 'warning'}
          />
        ))
      }
    </div>
  );
};

const InstructionContainer = styled(Component)<PropsType>(({ theme: { token } }: PropsType) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  '.alert-title.alert-title': {
    color: token.colorTextLight1
  },

  '.__alert-box': {
    minWidth: 300
  }

}));

export default InstructionContainer;
