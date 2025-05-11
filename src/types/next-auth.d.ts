import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      venues: {
        id: string;
        trxVenueId: number;
        venueName: string;
      }[];
      isSuperuser: boolean;
      isSalesTeam: boolean;
      trxCustomerId: string;
      seePrices: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    venues: {
      id: string;
      trxVenueId: number;
      venueName: string;
    }[];
    isSuperuser: boolean;
    isSalesTeam: boolean;
    trxCustomerId: string;
    seePrices: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string;
    venues: {
      id: string;
      trxVenueId: number;
      venueName: string;
    }[];
    isSuperuser: boolean;
    isSalesTeam: boolean;
    trxCustomerId: string;
    seePrices: boolean;
  }
}
