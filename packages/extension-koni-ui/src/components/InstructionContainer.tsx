// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { AlertBox } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
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
            title={t(alert.title)}
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
  gap: 10
}));

export default InstructionContainer;
