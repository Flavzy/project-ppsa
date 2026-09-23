import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2962FF', // Signature react-material-admin blue
      light: '#768fff',
      dark: '#0039cb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#263238',
      light: '#4f5b62',
      dark: '#000a12',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#263238',
      secondary: '#607d8b',
    },
    error: {
      main: '#f44336',
    },
    success: {
      main: '#4caf50',
    },
    divider: '#eceff1',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Poppins", "Lato", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '10px 20px',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0 4px 12px rgba(41, 98, 255, 0.25)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
  },
})

export default theme
