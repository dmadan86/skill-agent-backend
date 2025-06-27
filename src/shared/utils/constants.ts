export const FREEMIUM_PLAN_ID = "6842daae651f4a336c9bdfff";

export const PlanQuotas = {
    freemium: {
      name: "Freemium",
      price: 0,
      trialDays: 14,
      chat: {
        unlimited: true,
        tokenLimit: 5000,
      },
      voice: {
        includedMinutes: 60, // 1 hour
        extraRatePerMin: 0.2,
      },
      agent: {
        publicOnly: true,
        limit: 1,
      },
      team: {
        count: 1,
        userPerTeam: 2, // 1 owner + 1 invite
      },
    },
    startup: {
      name: "Startup",
      price: 20,
      chat: {
        unlimited: true,
        tokenLimit: null,
      },
      voice: {
        includedMinutes: 180, // 3 hours
        extraRatePerMin: 0.2,
      },
      agent: {
        publicOnly: false,
        limit: 3,
      },
      team: {
        count: 1,
        userPerTeam: 6, // 1 owner + 5 invites
      },
    },
    premium: {
      name: "Premium",
      price: 50,
      chat: {
        unlimited: true,
        tokenLimit: null,
      },
      voice: {
        includedMinutes: 600, // 10 hours
        extraRatePerMin: 0.2,
      },
      agent: {
        publicOnly: false,
        limit: Infinity,
      },
      team: {
        count: 10,
        userPerTeam: Infinity,
      },
    },
  };
  