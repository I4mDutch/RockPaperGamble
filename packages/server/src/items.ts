export interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "instant" | "trap" | "passive";
  config?: any;
}

export const ITEM_REGISTRY: Record<string, Item> = {
  atomic_bomb: {
    id: "atomic_bomb",
    name: "Atomic Bomb",
    description: "High-stakes steal! 90% from target, 30% from next player, 10% from all.",
    cost: 3000,
    type: "instant",
    config: {
      targetSteal: 0.9,
      nextSteal: 0.3,
      globalSteal: 0.1
    }
  },
  nuke: {
    id: "nuke",
    name: "Nuke",
    description: "Global pool grab. 25% backfire risk vs 75% impact.",
    cost: 5000,
    type: "instant",
    config: {
      backfireRisk: 0.25,
      poolTake: 0.75
    }
  },
  landmine: {
    id: "landmine",
    name: "Landmine",
    description: "Spectator trap. Awarded on specific RPS match hit.",
    cost: 250,
    type: "trap",
    config: {
      payout: 250
    }
  },
  interceptor: {
    id: "interceptor",
    name: "Interceptor",
    description: "Hidden phase modifier. Steal double wager ($200 min).",
    cost: 1000,
    type: "passive",
    config: {
      minSteal: 200
    }
  }
};
