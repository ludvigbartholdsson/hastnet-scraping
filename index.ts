import axios from "axios";
import { load } from "cheerio";
import * as XLSX from "xlsx";
import { SITES_TO_SCRAPE, SITES_TO_SCRAPE_IN_PARARELL } from "./config";

interface AdDetails {
  imageURLs: string[];
  title: string;
  description: string;
  race: string;
  age: string;
  length: string;
  seller: SellerDetails;
}

interface SellerDetails {
  name: string;
  location: string;
}

async function scrapePage(pageNumber: number): Promise<AdDetails[]> {
  const url = `https://www.hastnet.se/till-salu/hastar/?sidan=${pageNumber}`;
  const { data } = await axios.get(url);
  const $ = load(data);

  const ads: AdDetails[] = [];

  $("div.ListingsList_searchResults__Uf_4T a.Link_link__ce5zB").each(
    (_, element) => {
      const imageURLs: string[] = [];
      $(element)
        .find("img")
        .each((_, img) => {
          imageURLs.push($(img).attr("src")!);
        });

      const title = $(element)
        .find("h2.ListingTile_title___y0N4")
        .text()
        .trim();
      const description = $(element)
        .find("span.ListingTile_description__Gz9R8")
        .text()
        .trim();
      const race = $(element)
        .find('span[data-testid="listing-tile-attr-breed"]')
        .text()
        .trim();
      const age = $(element)
        .find('span[data-testid="listing-tile-attr-birthYear"]')
        .text()
        .trim();
      const length = $(element)
        .find('span[data-testid="listing-tile-attr-height"]')
        .text()
        .trim();

      const seller: SellerDetails = {
        name: $(element)
          .find("span.ListingTile_sellerName__kLEin")
          .text()
          .trim(),
        location: $(element)
          .find('span[data-testid="listing-location"]')
          .text()
          .trim(),
      };

      const adData = {
        imageURLs,
        title,
        description,
        race,
        age,
        length,
        seller,
      };

      if (imageURLs.length === 0 || !title || !description) {
        console.log("Missing data", url, adData, element);
      } else {
        ads.push(adData);
      }
    }
  );

  console.log("Saved page", pageNumber, "with", ads.length, "amount of ads");
  return ads;
}

async function scrapeAllPages(
  startPage: number,
  endPage: number,
  batchSize: number
): Promise<AdDetails[]> {
  const allAds: AdDetails[] = [];

  for (let i = startPage; i <= endPage; i += batchSize) {
    const pagePromises: Promise<AdDetails[]>[] = [];

    for (let j = i; j < i + batchSize && j <= endPage; j++) {
      pagePromises.push(scrapePage(j));
    }

    const batchData = await Promise.all(pagePromises);
    allAds.push(...batchData.flat());
  }

  return allAds;
}

function saveToExcel(ads: AdDetails[], fileName: string) {
  const wb = XLSX.utils.book_new();
  const wsData = ads.map((ad) => ({
    Title: ad.title,
    Description: ad.description,
    Race: ad.race,
    Age: ad.age,
    Length: ad.length,
    "Seller Name": ad.seller.name,
    "Seller Location": ad.seller.location,
    "Image URLS": ad.imageURLs.join(", "),
  }));
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Hästnet-ads");
  XLSX.writeFile(wb, fileName);
}

(async () => {
  const startPage = 1;
  try {
    const ads = await scrapeAllPages(
      startPage,
      SITES_TO_SCRAPE,
      SITES_TO_SCRAPE_IN_PARARELL
    );
    saveToExcel(ads, "output/ads.xlsx");
    console.log("Saved");
  } catch (error) {
    console.error("Err", error);
  }
})();
