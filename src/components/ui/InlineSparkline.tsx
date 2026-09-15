import type { FC } from "react";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
  ariaLabel?: string;
}

export const InlineSparkline: FC<Props> = ({
  data,
  width = 64,
  height = 18,
  color = "var(--primary-600)",
  fill = false,
  strokeWidth = 1.5,
  ariaLabel = "Historical trend sparkline",
}) => {
  if (!data || data.length < 2) {
    return <span style={{ color: "var(--slate-400)", fontSize: "0.75rem" }}>—</span>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 2;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastPoint = points.split(" ").pop()?.split(",");
  const lastX = lastPoint ? lastPoint[0] : "0";
  const lastY = lastPoint ? lastPoint[1] : "0";

  const fillPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible", display: "inline-block", verticalAlign: "middle" }}
      role="img"
      aria-label={ariaLabel}
    >
      {fill && (
        <polygon
          points={fillPoints}
          fill={color}
          opacity={0.12}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Current/latest observation dot */}
      <circle
        cx={Number(lastX)}
        cy={Number(lastY)}
        r={2}
        fill={color}
      />
    </svg>
  );
};
