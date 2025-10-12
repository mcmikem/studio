
'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  className,
}: ProgressRingProps) {
  const normalizedProgress = Math.max(0, Math.min(progress, 100));
  const data = [
    { name: 'Progress', value: normalizedProgress, color: 'hsl(var(--primary))' },
    { name: 'Remaining', value: 100 - normalizedProgress, color: 'hsl(var(--muted))' },
  ];

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={(size - strokeWidth * 2) / 2}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={450}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
        style={{ color: 'hsl(var(--primary))' }}
      >
        {`${Math.round(normalizedProgress)}%`}
      </div>
    </div>
  );
}
