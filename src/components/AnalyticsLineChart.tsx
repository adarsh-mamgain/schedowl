"use client";

import React from "react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";

const sampleData = [
  { month: "Jan", value: 400 },
  { month: "Feb", value: 450 },
  { month: "Mar", value: 470 },
  { month: "Apr", value: 460 },
  { month: "May", value: 500 },
  { month: "Jun", value: 520 },
  { month: "Jul", value: 530 },
  { month: "Aug", value: 550 },
  { month: "Sep", value: 570 },
  { month: "Oct", value: 580 },
  { month: "Nov", value: 600 },
  { month: "Dec", value: 620 },
];

const AnalyticsLineChart = ({ data = sampleData }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#444CE7" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#444CE7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: "#667085", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="#F2F4F7"
        />
        <Tooltip
          cursor={{ stroke: "#D0D5DD", strokeWidth: 1 }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #D0D5DD",
            backgroundColor: "white",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#444CE7"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#444CE7"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AnalyticsLineChart;
