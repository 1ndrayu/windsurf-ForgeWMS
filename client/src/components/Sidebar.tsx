import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorageIcon from '@mui/icons-material/Storage';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon /> },
  { text: 'Inventory', icon: <InventoryIcon /> },
  { text: 'Storage', icon: <StorageIcon /> },
  { text: 'Views', icon: <ShareIcon /> },
  { text: 'Settings', icon: <SettingsIcon /> },
];

const Sidebar: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <List>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ListItem button>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
