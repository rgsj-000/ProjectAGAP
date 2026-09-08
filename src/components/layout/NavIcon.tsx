"use client";

import React from "react";
import {
  Home,
  Radio,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  CheckSquare,
  FileEdit,
  TrendingUp,
  HelpCircle,
  LucideProps,
} from "lucide-react";

interface NavIconProps extends LucideProps {
  name: string;
}

export const NavIcon: React.FC<NavIconProps> = ({ name, ...props }) => {
  switch (name) {
    case "Home":
      return <Home {...props} />;
    case "Radio":
      return <Radio {...props} />;
    case "AlertTriangle":
      return <AlertTriangle {...props} />;
    case "Building2":
      return <Building2 {...props} />;
    case "FileSpreadsheet":
      return <FileSpreadsheet {...props} />;
    case "CheckSquare":
      return <CheckSquare {...props} />;
    case "FileEdit":
      return <FileEdit {...props} />;
    case "TrendingUp":
      return <TrendingUp {...props} />;
    case "HelpCircle":
      return <HelpCircle {...props} />;
    default:
      return <Home {...props} />;
  }
};
