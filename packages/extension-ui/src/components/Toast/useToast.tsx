import { useContext } from 'react';
import { ToastContext } from '../contexts';

export const useToast = (): {show: (message: string) => void} => useContext(ToastContext);
