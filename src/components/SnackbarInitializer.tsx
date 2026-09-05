'use client';

import { SnackbarProvider, useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { setSnackbarRef } from '@/utils/SnackbarUtils';

function InnerSnackbarInitializer() {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setSnackbarRef(enqueueSnackbar);
  }, [enqueueSnackbar]);

  return null;
}

export default function SnackbarInitializerProvider({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={2000}
    >
      <InnerSnackbarInitializer />
      {children}
    </SnackbarProvider>
  );
}
