// This has to match the maximum amount of "for-sale" pages available on hastnet.se.
// Currently: https://www.hastnet.se/till-salu/hastar/?sidan=189
export const SITES_TO_SCRAPE = 189;

// This has to be pretty low, otherwise the site crashes.
// I tried to run 200 in pararell on my machine and it crashed (not only for me but for everyone LOL)
export const SITES_TO_SCRAPE_IN_PARARELL = 5;
