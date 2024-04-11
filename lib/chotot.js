const config = require("../config");
const cheerio = require("cheerio");
const axios = require("axios");

const TrackingProduct = require("../models/tracking-product");
const ScrapedProduct = require("../models/scraped-product");

const { brightDataUsername, brightDataPW } = config;

async function isProductExisted(productId) {
  let result = await ScrapedProduct.findOne({
    sourceProductID: productId,
  });

  return result ? true : false;
}

function extractProductIdFromChotot(link) {
  const match = link.match(/\/(\d+)\.htm$/);
  if (!match) {
    // If the pattern is not found, return null or throw an error as needed
    return null;
  }
  return { prodId: match[1] };
}

async function scrapeChototItems({ keyword, source, urls }) {
  if (!urls) return;

  // config Brightdata
  const username = brightDataUsername;
  const pw = brightDataPW;
  const port = 22225;
  const sessionId = Date.now();

  const options = {
    auth: {
      username: `${username}-session-${sessionId}`,
      password: pw,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    // fetch the items page
    const allItems = [];
    const newItems = [];

    const productCreatePromises = [];

    const pageListPromises = urls.map((url) => axios.get(url, options));
    const results = await Promise.all(pageListPromises);

    results.forEach((page) => {
      const $ = cheerio.load(page.data);

      // extract list item
      const $list = $(".AdItem_wrapperAdItem__S6qPH");

      $list.each((id, ref) => {
        const title = $(ref).find(".commonStyle_adTitle__g520j").text();
        const price = $(ref).find(".AdBody_adPriceNormal___OYFU").text();

        const anchor = $(ref).find(".AdItem_adItem__gDDQT");
        const href = $(anchor).attr("href");

        // chợ tốt có nhiều domain. VD: bán xe cộ thì ở xe.chotot.com, bất động sản thì ở nhatot.com..., còn lại là ở chotot.com
        // do đó cần kiểm tra xem trong href có sẵn domain hay không. Nếu có thì lấy luôn, không thì append domain chotot.com vào
        const link = !href?.includes("https")
          ? "https://www.chotot.com" + href
          : href;

        const prodId = extractProductIdFromChotot(link)?.prodId;

        let postedAt = "";
        let location = "";

        const newItem = {
          keyword,
          source,
          sourceProductID: prodId || link,
          title,
          price,
          link,
          postedAt,
          location,
        };

        allItems.push(newItem);
      });
    });

    // load detail page to fetch additional data: postedAt, location, description

    // check if any item is in DB or not. If not, insert it
    for (let i = 0; i < allItems.length; i++) {
      let item = allItems[i];

      let isProductInDB = await isProductExisted(
        item.sourceProductID || item.link
      );

      if (!isProductInDB) {
        newItems.push(item);

        const newProduct = new ScrapedProduct(item);
        newProduct.save();

        productCreatePromises.push(newProduct.save());
      }
    }

    await Promise.all(productCreatePromises);

    return { allItems, newItems };
  } catch (error) {
    throw new Error(`Failed to scrape product: ${error.message}`);
  }
}

module.exports = { scrapeChototItems };
