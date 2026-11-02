import { createTheme } from '@mui/material';

/** MUI themed to the prototype so its components don't look like stock Material. */
export const theme = createTheme({
  palette: {
    primary: { main: '#2d8dfe', dark: '#1f67c5', contrastText: '#fff' },
    secondary: { main: '#000000' },
    error: { main: '#ec4f3c' },
    success: { main: '#15b85f' },
    text: { primary: '#13233d', secondary: '#71829b' },
    background: { default: '#f1f6fd', paper: '#fff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    button: { textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1.2px', fontSize: 11 },
  },
  components: {
    MuiSkeleton: { defaultProps: { animation: 'wave' }, styleOverrides: { root: { borderRadius: 8 } } },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8, background: '#102447', fontSize: 11, fontFamily: 'inherit' } },
    },
    MuiDialog: { defaultProps: { transitionDuration: { enter: 220, exit: 160 } } },
  },
});
