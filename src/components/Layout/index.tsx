import React from "react";
import { Box } from "@mui/material";
import Menu from "../Menu";
import Content from "../Content";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex" }}>
      {/* 侧边栏 */}
      <Menu />
      <Content>{children}</Content>
    </Box>
  );
}
