import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// Move the venues data here so it's only accessible from the server
const VENUES = [
  { name: "AHERN HOTEL", id: 95368 },
  { name: "ALEXXA", id: 81395 },
  { name: "ALIANTE CASINO & HOTEL", id: 81462 },
  { name: "ARIA RESORT & CASINO", id: 81692 },
  { name: "BARRY'S DOWNTOWN PRIME", id: 96028 },
  { name: "BEAUTY & ESSEX LAS VEGAS", id: 89143 },
  { name: "BELLAGIO", id: 80887 },
  { name: "BINION'S GAMBLING HALL & HOTEL", id: 81576 },
  { name: "BOULDER STATION HOTEL", id: 81651 },
  { name: "CAESARS PALACE", id: 81695 },
  { name: "Caesars Republic Lake Tahoe Hotel & Casino", id: 94509 },
  { name: "CAFE AMERICANO", id: 82375 },
  { name: "CAFE AMERICANO @ PARIS HOTEL", id: 95528 },
  { name: "CASABLANCA", id: 80931 },
  { name: "CIRCUS CIRCUS HOTEL", id: 81746 },
  { name: "COSMO RESORT CASINO", id: 81401 },
  { name: "CROMWELL", id: 81952 },
  { name: "DURANGO RESORT", id: 99388 },
  { name: "EIFFEL TOWER LLC", id: 80683 },
  { name: "ELLIS ISLAND", id: 80866 },
  { name: "EXCALIBUR", id: 81752 },
  { name: "FLAMINGO LAS VEGAS", id: 81756 },
  { name: "FONTAINEBLEAU", id: 99970 },
  { name: "FONTAINEBLEAU LAS VEGAS", id: 101309 },
  { name: "FOUR QUEENS HOTEL", id: 81758 },
  { name: "FOUR SEASONS HOTEL LAS VEGAS", id: 80860 },
  { name: "GFG PIERO'S", id: 81002 },
  { name: "GOLD COAST HOTEL #1012593", id: 81764 },
  { name: "GOLDEN NUGGET", id: 81794 },
  { name: "GOLDEN NUGGET-LAUGHLIN", id: 81316 },
  { name: "GRAND SIERRA RESORT", id: 95249 },
  { name: "GREEN VALLEY RANCH GAMING", id: 81070 },
  { name: "HARD ROCK NEVADA, LLC", id: 81821 },
  { name: "HARRAH'S LAS VEGAS", id: 81829 },
  { name: "HARRAH'S LAUGHLIN CASINO", id: 80730 },
  { name: "HAVANA 1957", id: 102889 },
  { name: "HORSESHOE LV", id: 81001 },
  { name: "ISLAND HOTEL COMPANY, LTD DBA ATLANTIS HOTEL", id: 81224 },
  { name: "JAVIER'S LAS VEGAS", id: 81034 },
  { name: "JW MARRIOTT HOTEL LV", id: 81160 },
  { name: "LAVO", id: 81696 },
  { name: "LUXOR", id: 81633 },
  { name: "M RESORT*SPA*CASINO", id: 81427 },
  { name: "MANDALAY BAY", id: 80700 },
  { name: "MGM GRAND", id: 81817 },
  { name: "MISC CASH SALES", id: 81506 },
  { name: "MON AMI GABI", id: 80823 },
  { name: "NEW YORK NEW YORK", id: 80964 },
  { name: "NEW YORK NEW YORK CASINO HOTEL", id: 80911 },
  { name: "ORLEANS HOTEL # 1012593", id: 81114 },
  { name: "PALACE STATION", id: 81189 },
  { name: "PALMS CASINO RESORT", id: 81134 },
  { name: "PARIS HOTEL", id: 80855 },
  { name: "PARK MGM LAS VEGAS", id: 80768 },
  { name: "PECHANGA RESORT & CASINO", id: 81610 },
  { name: "PLANET HOLLYWOOD", id: 81396 },
  { name: "PLAZA HOTEL", id: 92208 },
  { name: "RED ROCK STATION", id: 82066 },
  { name: "RENAISSANCE LV HOTEL", id: 81025 },
  { name: "RESORT WORLD LAS VEGAS LLC", id: 95748 },
  { name: "RIO HOTEL & CASINO", id: 81795 },
  { name: "SAHARA LAS VEGAS", id: 81938 },
  { name: "SANTA FE STATION", id: 81989 },
  { name: "SILVER LEGACY", id: 97328 },
  { name: "SILVERTON CASINO,LLC.", id: 81649 },
  { name: "SOUTHPOINT HOTEL & CASINO", id: 81280 },
  { name: "SUNCOAST HOTEL & CASINO", id: 81975 },
  { name: "SUNSET STATION HOTEL & CASINO", id: 80920 },
  { name: "SWINGERS LAS VEGAS", id: 102589 },
  { name: "TAMBA LAS VEGAS", id: 102649 },
  { name: "TAO LAS VEGAS", id: 81283 },
  { name: "The Bar @ Center Pointe", id: 102369 },
  { name: "THE D", id: 81754 },
  { name: "THE STRAT HOTEL & CASINO", id: 80682 },
  { name: "TREASURE ISLAND", id: 81524 },
  { name: "VENETIAN RESORT HOTEL", id: 80966 },
  { name: "VIRGIN HOTELS LAS VEGAS", id: 96428 },
  { name: "WALDORF ASTORIA LAS VEGAS", id: 81693 },
  { name: "WESTGATE LAS VEGAS RESORT", id: 80959 },
  { name: "WYNN LAS VEGAS", id: 81661 },
];

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSalesTeam) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Get search query from URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  // Filter venues based on search query
  const filteredVenues = query
    ? VENUES.filter(
        (venue) =>
          venue.name.toLowerCase().includes(query) ||
          venue.id.toString().includes(query)
      )
    : VENUES;

  return new NextResponse(JSON.stringify(filteredVenues), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
