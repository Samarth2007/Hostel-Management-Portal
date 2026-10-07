"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function Occupancy({ data }: { data: { name: string; occupied: number; free: number }[] }) {
  return <ResponsiveContainer width="100%" height={220}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e6e0ff" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
    <Bar dataKey="occupied" stackId="a" fill="#6d5ef5" radius={[0, 0, 6, 6]} /><Bar dataKey="free" stackId="a" fill="#2ec4a0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>;
}
export function Categories({ data }: { data: { name: string; count: number }[] }) {
  return <ResponsiveContainer width="100%" height={220}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#ffe3d6" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#ff8a6b" radius={6} /></BarChart></ResponsiveContainer>;
}
