export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL,
  SUB_API_URL: process.env.SUB_API_URL,
  FORWARDING_API_URL: process.env.FORWARDING_API_URL || process.env.NEXT_PUBLIC_API_URL,
  FORWARDING_ADMIN_TOKEN: process.env.FORWARDING_ADMIN_TOKEN,
  FORWARDING_ALLOWED_PLAN_IDS: (process.env.NEXT_PUBLIC_FORWARDING_ALLOWED_PLAN_IDS || '').split(',').map(Number).filter(Boolean),
  FORWARDING_PLAN_MAP: process.env.NEXT_PUBLIC_FORWARDING_PLAN_MAP
    ? Object.fromEntries(
        process.env.NEXT_PUBLIC_FORWARDING_PLAN_MAP.split(',').map(pair => {
          const [userPlan, forwardPlan] = pair.split(':');
          return [userPlan, forwardPlan];
        })
      )
    : {},
}
