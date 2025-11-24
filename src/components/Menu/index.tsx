"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  Inbox as InboxIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ShoppingCart,
  Loupe,
  Dataset,
} from "@mui/icons-material";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);

  // 根据当前路径自动展开对应的父菜单
  // React.useEffect(() => {
  //   menuItems.forEach((item) => {
  //     if (item.children.length > 0) {
  //       const isChildActive = item.children.some(
  //         (child) => child.path === pathname
  //       );
  //       if (isChildActive) {
  //         setSubmenuOpen(item.key);
  //       }
  //     }
  //   });
  // }, [pathname]);

  const handleSubmenuToggle = (key: string) => {
    setSubmenuOpen(submenuOpen === key ? null : key);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // 菜单配置数据
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
  ];

  return (
    <Drawer
      sx={{
        width: open ? 240 : 60,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? 240 : 60,
          boxSizing: "border-box",
          bgcolor: "#111417",
          color: "#ffffff",
          transition: "width 0.2s",
          overflowX: "hidden",
        },
      }}
      variant="persistent"
      anchor="left"
      open
    >
      {/* 收缩按钮 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: open ? "flex-end" : "center",
          p: 1,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <IconButton onClick={() => setOpen(!open)} sx={{ color: "#ffffff" }}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      {/* 菜单 */}
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.key}>
            <Tooltip title={!open ? item.text : ""} placement="right">
              <ListItem
                onClick={
                  item.children.length > 0
                    ? () => handleSubmenuToggle(item.key)
                    : () => handleNavigate(item.path!)
                }
                sx={{
                  cursor: "pointer",
                  bgcolor:
                    pathname === item.path ? "action.selected" : "inherit",
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#ffffff",
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} />}
                {open &&
                  item.children.length > 0 &&
                  (submenuOpen === item.key ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
            </Tooltip>
            {/* 子菜单 */}
            {open && item.children.length > 0 && (
              <Collapse
                in={submenuOpen === item.key}
                timeout="auto"
                unmountOnExit
              >
                <List disablePadding>
                  {item.children.map((child, childIndex) => (
                    <ListItem
                      key={childIndex}
                      onClick={() => handleNavigate(child.path)}
                      sx={{
                        cursor: "pointer",
                        bgcolor:
                          pathname === child.path
                            ? "action.selected"
                            : "inherit",
                        pl: 4,
                      }}
                    >
                      <ListItemText primary={child.text} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
}
