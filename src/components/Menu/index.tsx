import {
  Home as HomeIcon,
  Inbox as InboxIcon,
  ShoppingCart,
  Loupe,
  Dataset,
} from "@mui/icons-material";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import Link from "next/link";

// 静态菜单数据
const menuItems = [
  {
    key: "home",
    text: "HOME",
    icon: <HomeIcon />,
    path: "/",
    children: [],
  },
  {
    key: "ron-staking",
    text: "RON Staking",
    icon: <InboxIcon />,
    children: [
      { text: "stake", path: "/ron-staking/stake" },
      { text: "WAGMI", path: "/ron-staking/wagmi" },
    ],
  },
  {
    key: "Listmynft",
    text: "List My NFT",
    icon: <Loupe />,
    path: "/List-my-nft",
    children: [],
  },
  {
    key: "marketplace",
    text: "Marketplace",
    icon: <Dataset />,
    path: "/marketplace",
    children: [],
  },
  {
    key: "profile",
    text: "Profile",
    icon: <ShoppingCart />,
    path: "/profile",
    children: [],
  },
  {
    key: "cex",
    text: "Cex",
    icon: <ShoppingCart />,
    path: "/cex",
    children: [],
  },
  {
    key: "order-book",
    text: "orderBook",
    icon: <ShoppingCart />,
    path: "/order-book",
    children: [],
  },
];

// 纯服务端组件
export default function Sidebar() {
  return (
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          bgcolor: "#111417",
          color: "#ffffff",
          overflowX: "hidden",
        },
      }}
      variant="persistent"
      anchor="left"
      open
    >
      {/* 菜单列表 */}
      <List>
        {menuItems.map((item) => (
          <div key={item.key}>
            {/* 主菜单项 */}
            {item.path ? (
              <Link
                href={item.path}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <ListItem
                  sx={{
                    cursor: "pointer",
                    px: 2.5,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.08)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "#ffffff",
                      minWidth: 0,
                      mr: 3,
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              </Link>
            ) : (
              <ListItem
                sx={{
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#ffffff",
                    minWidth: 0,
                    mr: 3,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            )}

            {/* 子菜单 */}
            {item.children.length > 0 && (
              <List disablePadding>
                {item.children.map((child, childIndex) => (
                  <Link
                    key={childIndex}
                    href={child.path}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <ListItem
                      sx={{
                        cursor: "pointer",
                        pl: 4,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.08)",
                        },
                      }}
                    >
                      <ListItemText primary={child.text} />
                    </ListItem>
                  </Link>
                ))}
              </List>
            )}
          </div>
        ))}
      </List>
    </Drawer>
  );
}
