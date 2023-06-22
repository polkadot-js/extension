// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useTranslation } from 'react-i18next';

interface LearnMoreProps {
  href: string;
  children?: React.ReactNode;
  className?: string;
}

const LearnMore: React.FC<LearnMoreProps> = ({ children, className = '', href }) => {
  const { t } = useTranslation();

  return (
    <a
      className={`link ${className}`}
      href={href}
      rel='noreferrer'
      target='_blank'
    >
      {children || t<string>('Learn more')}
    </a>
  );
};

export default LearnMore;
