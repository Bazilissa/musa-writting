import logoSrc from "@/assets/muza-logo.png";

type RoomLogoProps = {
  className?: string;
  compact?: boolean;
};

export function RoomLogo({ className = "" }: RoomLogoProps) {
  return (
    <div
      className={`room-logo flex items-center justify-center overflow-hidden rounded-full border border-ember/25 bg-card shadow-sm ${className}`}
    >
      <img
        src={logoSrc}
        alt="Комната со столом"
        className="h-full w-full object-cover"
        loading="lazy"
        width={512}
        height={512}
      />
    </div>
  );
}
