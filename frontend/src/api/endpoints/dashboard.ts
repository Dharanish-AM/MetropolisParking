import { client } from "../client";

export const getDashboardStats = async () => {
  const res = await client.get("/dashboard");
  return res.data;
};
