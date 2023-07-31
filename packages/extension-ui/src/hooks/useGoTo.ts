import { useCallback, useContext } from 'react';

import { ActionContext } from '../components/contexts';

export const useGoTo = () => {
  const onAction = useContext(ActionContext);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  return { goTo };
};
