import z from "zod";

export const recentCustomersSchema = z.object({
  walletAddress: z.string(),
  name: z.string(),
  mobile: z.string(),
  status: z.string(),
  selfStake: z.number(),
  teamBusiness: z.number(),
  level: z.number(),
  joinedDate: z.string(),
});

export type RecentCustomerRow = z.infer<typeof recentCustomersSchema>;
