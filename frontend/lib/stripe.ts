import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export const STRIPE_PRICE_PRO        = process.env.STRIPE_PRICE_PRO!;
export const STRIPE_PRICE_ENTERPRISE = process.env.STRIPE_PRICE_ENTERPRISE!;
