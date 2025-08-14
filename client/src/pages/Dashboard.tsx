import { Box, Grid, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorageIcon from '@mui/icons-material/Storage';
import ShareIcon from '@mui/icons-material/Share';
import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => (
  <Paper
    sx={{
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {icon}
    </motion.div>
    <Typography variant="h6" sx={{ mt: 2 }}>
      {title}
    </Typography>
    <Typography variant="h4" sx={{ mt: 1 }}>
      {value}
    </Typography>
  </Paper>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    storageLocations: 0,
    sharedViews: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats from API
    // This will be implemented with backend integration
    const mockStats = {
      totalItems: 1234,
      storageLocations: 45,
      sharedViews: 15,
    };
    setStats(mockStats);
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Total Items"
            value={stats.totalItems}
            icon={
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </motion.div>
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Storage Locations"
            value={stats.storageLocations}
            icon={
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <StorageIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              </motion.div>
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Shared Views"
            value={stats.sharedViews}
            icon={
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ShareIcon sx={{ fontSize: 40, color: 'primary.light' }} />
              </motion.div>
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
