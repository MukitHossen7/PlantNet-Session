import { Legend } from "@headlessui/react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

// eslint-disable-next-line react/prop-types
const Charts = ({ chartData }) => {
  console.log(chartData);
  // const data = [
  //   {
  //     date: "01/05/2025",
  //     quantity: 4,
  //     price: 2400,
  //   },
  //   {
  //     name: "Page B",
  //     quantity: 3000,
  //     price: 1398,
  //   },
  //   {
  //     name: "Page C",
  //     quantity: 2000,
  //     price: 9800,
  //   },
  //   {
  //     name: "Page D",
  //     quantity: 2780,
  //     price: 3908,
  //   },
  //   {
  //     name: "Page E",
  //     quantity: 1890,
  //     price: 4800,
  //   },
  //   {
  //     name: "Page F",
  //     quantity: 2390,
  //     price: 3800,
  //   },
  //   {
  //     name: "Page G",
  //     quantity: 3490,
  //     price: 4300,
  //   },
  // ];
  return (
    <div>
      <BarChart width={730} height={250} data={[chartData]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="price" fill="#8884d8" />
        <Bar dataKey="quantity" fill="#82ca9d" />
      </BarChart>
    </div>
  );
};

export default Charts;
