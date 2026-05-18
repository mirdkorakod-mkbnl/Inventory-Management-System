"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Paper, Title, Text } from "@mantine/core";

interface Product {
  name: string;
  stock: number;
}

interface Props {
  products: Product[];
}

export default function StockByProductChart({ products }: Props) {
  const data = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      stock: p.stock,
    }));

  if (data.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Text c="dimmed">No product data available</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        Top 10 Products by Stock
      </Title>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis />
          
            <Tooltip
            formatter={(value) => {
                if (value == null) return ["0 units", "Stock"];
                return [`${value} units`, "Stock"];
            }}
            />

          <Bar dataKey="stock" fill="#4dabf7" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
