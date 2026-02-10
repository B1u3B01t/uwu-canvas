interface FolderIconProps {
  tabColor: string;
  bodyColor: string;
  className?: string;
  size?: number;
}

export function FolderIcon({ tabColor, bodyColor, className, size = 20 }: FolderIconProps) {
  // Aspect ratio: 112x80
  const height = size * (80 / 112);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 112 80"
      fill="none"
      className={className}
    >
      <path
        d="M8 12C8 8.68629 10.6863 6 14 6H42L50 14H14C10.6863 14 8 16.6863 8 20V12Z"
        fill={tabColor}
      />
      <path
        d="M8 20C8 16.6863 10.6863 14 14 14H98C101.314 14 104 16.6863 104 20V68C104 71.3137 101.314 74 98 74H14C10.6863 74 8 71.3137 8 68V20Z"
        fill={bodyColor}
      />
    </svg>
  );
}
