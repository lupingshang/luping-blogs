import React from "react";
import { Box } from "@mui/material";

export default function Content({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        p: 3,
      }}
    >
      {children}
    </Box>
  );
}
