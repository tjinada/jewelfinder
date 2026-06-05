/**
 * Static, Canada-wide list of cities/municipalities used to power the location
 * autocomplete. Bundled with the app (no geocoding API) so it works offline and
 * filters instantly. This feeds the UI only — locations are still stored as free
 * text, and users may type a value that isn't in this list. If the backend ever
 * needs to validate against it, move this to `@jewel/shared`.
 */

const RAW: string[] = [
  // Ontario
  'Toronto, ON', 'Ottawa, ON', 'Mississauga, ON', 'Brampton, ON', 'Hamilton, ON',
  'London, ON', 'Markham, ON', 'Vaughan, ON', 'Kitchener, ON', 'Windsor, ON',
  'Richmond Hill, ON', 'Oakville, ON', 'Burlington, ON', 'Greater Sudbury, ON',
  'Oshawa, ON', 'Barrie, ON', 'St. Catharines, ON', 'Guelph, ON', 'Cambridge, ON',
  'Whitby, ON', 'Ajax, ON', 'Waterloo, ON', 'Thunder Bay, ON', 'Brantford, ON',
  'Pickering, ON', 'Niagara Falls, ON', 'Peterborough, ON', 'Kingston, ON',
  'Sault Ste. Marie, ON', 'Sarnia, ON', 'Welland, ON', 'North Bay, ON',
  'Belleville, ON', 'Cornwall, ON', 'Chatham-Kent, ON', 'Newmarket, ON',
  'Aurora, ON', 'Milton, ON', 'Clarington, ON', 'Caledon, ON', 'Halton Hills, ON',
  'Georgina, ON', 'East Gwillimbury, ON', 'Whitchurch-Stouffville, ON', 'King, ON',
  'Uxbridge, ON', 'Scugog, ON', 'Brock, ON', 'Innisfil, ON',
  'Bradford West Gwillimbury, ON', 'Orillia, ON', 'Collingwood, ON',
  'Wasaga Beach, ON', 'Midland, ON', 'Owen Sound, ON', 'Stratford, ON',
  'Woodstock, ON', 'Orangeville, ON', 'Fort Erie, ON', 'Grimsby, ON', 'Lincoln, ON',
  'Pelham, ON', 'Thorold, ON', 'Port Colborne, ON', 'Niagara-on-the-Lake, ON',
  'Cobourg, ON', 'Port Hope, ON', 'Quinte West, ON', 'Timmins, ON', 'Kenora, ON',
  'Kapuskasing, ON', 'Elliot Lake, ON', 'Tillsonburg, ON', 'Leamington, ON',
  'Kingsville, ON', 'Amherstburg, ON', 'LaSalle, ON', 'Tecumseh, ON',
  'Bracebridge, ON', 'Gravenhurst, ON', 'Huntsville, ON', 'Pembroke, ON',
  'Brockville, ON', 'Gananoque, ON', 'Carleton Place, ON', 'Petawawa, ON',
  'Hawkesbury, ON', 'Dryden, ON', 'Fort Frances, ON', 'Ingersoll, ON',
  'Strathroy, ON', 'Hanover, ON', 'Kawartha Lakes, ON', 'Norfolk County, ON',
  'Fergus, ON', 'Arnprior, ON', 'Renfrew, ON', 'Smiths Falls, ON', 'Perth, ON',
  'Napanee, ON',
  // Quebec
  'Montreal, QC', 'Quebec City, QC', 'Laval, QC', 'Gatineau, QC', 'Longueuil, QC',
  'Sherbrooke, QC', 'Saguenay, QC', 'Trois-Rivières, QC', 'Lévis, QC',
  'Terrebonne, QC', 'Saint-Jean-sur-Richelieu, QC', 'Repentigny, QC',
  'Drummondville, QC', 'Saint-Jérôme, QC', 'Granby, QC', 'Blainville, QC',
  'Saint-Hyacinthe, QC', 'Shawinigan, QC', 'Rimouski, QC', 'Châteauguay, QC',
  // British Columbia
  'Vancouver, BC', 'Surrey, BC', 'Burnaby, BC', 'Richmond, BC', 'Abbotsford, BC',
  'Coquitlam, BC', 'Kelowna, BC', 'Langley, BC', 'Saanich, BC', 'Delta, BC',
  'Kamloops, BC', 'Nanaimo, BC', 'Victoria, BC', 'Chilliwack, BC', 'Maple Ridge, BC',
  'New Westminster, BC', 'Prince George, BC', 'Vernon, BC', 'Penticton, BC',
  'Campbell River, BC', 'North Vancouver, BC', 'West Vancouver, BC',
  'Port Coquitlam, BC',
  // Alberta
  'Calgary, AB', 'Edmonton, AB', 'Red Deer, AB', 'Lethbridge, AB', 'St. Albert, AB',
  'Medicine Hat, AB', 'Grande Prairie, AB', 'Airdrie, AB', 'Spruce Grove, AB',
  'Leduc, AB', 'Fort McMurray, AB', 'Lloydminster, AB', 'Camrose, AB',
  'Cochrane, AB', 'Okotoks, AB',
  // Manitoba
  'Winnipeg, MB', 'Brandon, MB', 'Steinbach, MB', 'Thompson, MB',
  'Portage la Prairie, MB', 'Winkler, MB', 'Selkirk, MB',
  // Saskatchewan
  'Saskatoon, SK', 'Regina, SK', 'Prince Albert, SK', 'Moose Jaw, SK',
  'Swift Current, SK', 'Yorkton, SK', 'North Battleford, SK', 'Estevan, SK',
  // Nova Scotia
  'Halifax, NS', 'Sydney, NS', 'Dartmouth, NS', 'Truro, NS', 'New Glasgow, NS',
  'Glace Bay, NS',
  // New Brunswick
  'Moncton, NB', 'Saint John, NB', 'Fredericton, NB', 'Dieppe, NB', 'Miramichi, NB',
  'Bathurst, NB', 'Edmundston, NB',
  // Newfoundland and Labrador
  "St. John's, NL", 'Mount Pearl, NL', 'Corner Brook, NL', 'Conception Bay South, NL',
  'Paradise, NL', 'Grand Falls-Windsor, NL',
  // Prince Edward Island
  'Charlottetown, PE', 'Summerside, PE', 'Stratford, PE',
  // Territories
  'Yellowknife, NT', 'Hay River, NT', 'Inuvik, NT',
  'Whitehorse, YT', 'Dawson City, YT',
  'Iqaluit, NU', 'Rankin Inlet, NU',
];

/** De-duplicated and alphabetised once at module load. */
export const CITIES: string[] = [...new Set(RAW)].sort((a, b) => a.localeCompare(b));

/**
 * Cities matching `query`, with prefix matches before substring matches, then
 * alphabetical (CITIES is pre-sorted). Returns up to `limit` results.
 */
export function searchCities(query: string, limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const city of CITIES) {
    const lc = city.toLowerCase();
    if (lc.startsWith(q)) starts.push(city);
    else if (lc.includes(q)) contains.push(city);
  }
  return [...starts, ...contains].slice(0, limit);
}
