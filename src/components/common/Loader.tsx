'use client';

// initialise loader in the App.tsx
import { Box, CircularProgress } from '@mui/material';
import { useLoaderStore } from '../../store/useLoaderStore';

const Loader = () => {
  const { isLoading } = useLoaderStore();

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1300,
        width: '100vw',
        height: '100vh',
        bgcolor: 'rgba(255,255,255,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#282828'
      }}
    >
      <CircularProgress size={40} />
    </Box>
  );
};

export default Loader;
