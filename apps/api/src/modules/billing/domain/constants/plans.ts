import { Plan } from '@prisma/client';

export interface PlanConfig {
  name: string;
  contactLimit: number | null; // null = unlimited
  priceId: string | null; // null = free plan
  price: number;
  maxUsers: number;
}

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  [Plan.FREE]: {
    name: 'Gratuit',
    contactLimit: 10,
    priceId: null,
    price: 0,
    maxUsers: 1,
  },
  [Plan.SOLO]: {
    name: 'Solo',
    contactLimit: null,
    priceId: process.env.STRIPE_SOLO_PRICE_ID || '',
    price: 10,
    maxUsers: 1,
  },
  [Plan.TEAM]: {
    name: 'Team',
    contactLimit: null,
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    price: 20,
    maxUsers: 3,
  },
};

export function getPlanContactLimit(plan: Plan): number | null {
  return PLAN_CONFIG[plan].contactLimit;
}

export function getPlanPriceId(plan: Plan): string | null {
  return PLAN_CONFIG[plan].priceId;
}
