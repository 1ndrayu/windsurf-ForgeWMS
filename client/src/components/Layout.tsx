import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { motion } from 'framer-motion';
import theme from '../theme';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box
          component={motion.div}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }}
        >
          <Navbar />
          <Box component="main" sx={{ flex: 1, p: 3 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
