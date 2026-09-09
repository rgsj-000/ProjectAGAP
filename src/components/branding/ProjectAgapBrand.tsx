import Image from "next/image";

interface ProjectAgapBrandProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export const ProjectAgapBrand: React.FC<ProjectAgapBrandProps> = ({
  width = 180,
  height = 54,
  className = "",
  priority = false,
}) => {
  return (
    <Image
      src="/images/branding/project-agap-logo-horizontal.png"
      alt="Project AGAP"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={priority}
    />
  );
};
