// to be used in SnackbarInitializer.tsx
import { SnackbarMessage, VariantType } from 'notistack';

let snackbarRef: ((msg: SnackbarMessage, options: { variant: VariantType }) => void) | null = null;

export const setSnackbarRef = (
  enqueueSnackbarRef: typeof snackbarRef
) => {
  snackbarRef = enqueueSnackbarRef;
};

export const showAppToast = (
  message: SnackbarMessage,
  variant: VariantType = 'default'
) => {
  if (snackbarRef) {
    snackbarRef(message, { variant });
  } else {
    console.warn('Snackbar reference not initialized yet.');
  }
};
