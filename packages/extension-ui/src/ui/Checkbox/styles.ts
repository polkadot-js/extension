import { styled } from '../../styles';
import { visuallyHidden } from '../../styles/utils';
import { Icon } from '../Icon';

export const Input = styled.input(visuallyHidden);

export const CheckStateIcon = styled(Icon)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'block',
  visibility: 'hidden',
  opacity: 0,
  pointerEvents: 'none',
  margin: 'auto',
  transition: `${theme.transitions.hover.ms}ms`,
}));

export const CheckboxInput = styled.div(({ theme }) => ({
  position: 'relative',
  cursor: 'pointer',
  transition: `${theme.transitions.hover.ms}ms`,
  boxSizing: 'border-box',
  border: `2px solid ${theme.colors.gray[3]}`,
  borderRadius: theme.radii[1],
  width: '18px',
  height: '18px',
  backgroundColor: '#fff',
  userSelect: 'none',

  [`${Input}:focus + &`]: {
    borderColor: theme.colors.primary,
  },

  [`${Input}:checked:focus + &`]: {
    borderColor: theme.colors.primary,
  },

  [`${Input}:checked + &`]: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  [`${Input}:checked + & .checkIcon`]: {
    visibility: 'visible',
    opacity: 1,
  },

  '&.indeterminate': {
    borderColor: theme.colors.primary,

    '.minusIcon': {
      visibility: 'visible',
      opacity: 1,
    },

    '.checkIcon': {
      visibility: 'hidden',
      opacity: 0,
    },
  },
}));
