import React from 'react';

interface ProgressRingProps {
  score: number;          // 0–100
  size?: number;          // px
  strokeWidth?: number;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 85) return '#16a34a';   // green-600
  if (score >= 65) return '#2563eb';   // blue-600
  if (score >= 40) return '#d97706';   // amber-600
  return '#dc2626';                     // red-600
}

export function ProgressRing({ score, size = 120, strokeWidth = 10, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Eligibility score: ${score} out of 100`}
        role="img"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Score text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".35em"
          fontSize={size / 4.5}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
      </svg>
      {label && (
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      )}
    </div>
  );
}
