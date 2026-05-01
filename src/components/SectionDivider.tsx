export default function SectionDivider({
  flip = false,
  variant = "orange",
}: {
  flip?: boolean;
  variant?: "orange" | "cyan";
}) {
  const color1 =
    variant === "orange"
      ? "rgba(255, 106, 0, 0.08)"
      : "rgba(0, 229, 255, 0.08)";
  const color2 =
    variant === "orange"
      ? "rgba(0, 229, 255, 0.04)"
      : "rgba(255, 106, 0, 0.04)";

  return (
    <div
      className="section-divider"
      style={{ transform: flip ? "scaleY(-1)" : "none" }}
    >
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 60C240 120 480 0 720 60C960 120 1200 0 1440 60V120H0V60Z"
          fill={color1}
        />
        <path
          d="M0 80C360 20 720 100 1080 40C1260 10 1380 50 1440 80V120H0V80Z"
          fill={color2}
        />
      </svg>
    </div>
  );
}
