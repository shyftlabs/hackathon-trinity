export function SynapseIcon({
  size = 36,
  color = "#0066cc",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded hexagon outline */}
      <path
        d="M17.134 3.268C17.6681 2.9107 18.3319 2.9107 18.866 3.268L29.6603 9.768C30.1944 10.1254 30.5 10.7107 30.5 11.337V24.663C30.5 25.2893 30.1944 25.8746 29.6603 26.232L18.866 32.732C18.3319 33.0893 17.6681 33.0893 17.134 32.732L6.33975 26.232C5.80563 25.8746 5.5 25.2893 5.5 24.663V11.337C5.5 10.7107 5.80563 10.1254 6.33975 9.768L17.134 3.268Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* S shape — two arcs forming the letter */}
      <path
        d="M22.5 14.5C22.5 13.119 21.381 12 20 12H16C14.619 12 13.5 13.119 13.5 14.5C13.5 15.881 14.619 17 16 17H20C21.381 17 22.5 18.119 22.5 19.5C22.5 20.881 21.381 22 20 22H16C14.619 22 13.5 20.881 13.5 19.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
