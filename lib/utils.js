function objectToQueryParams(obj) {
  const queryString = Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join("&");
  return `?${queryString}`;
}

function constructChototScrapingUrl(keyword) {
  const host = "https://www.chotot.com/mua-ban-ha-noi";

  // get url for the latest 5 pages
  const scrapingUrls = [];

  for (let i = 1; i <= 5; i++) {
    const queryParamsObj = {
      q: keyword,
      f: "p",
      sp: "0",
      page: String(i),
    };

    const queryParamsStr = objectToQueryParams(queryParamsObj);
    const scrapingUrl = host + queryParamsStr;
    scrapingUrls.push(scrapingUrl);
  }

  return scrapingUrls;
}

function generateSlug(st, separator = "-") {
  if (!str) {
    return "";
  }
  return str
    .toString()
    .normalize("NFD") // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 :]/g, "") // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, separator);
}

function chunkArray(array, chunkSize) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunkedArray.push(array.slice(i, i + chunkSize));
  }
  return chunkedArray;
}

function splitThousands(data) {
  // Convert number to string
  const numberString = data.toString();

  // Split the string into an array of characters
  const characters = numberString.split("");

  // Insert commas at appropriate positions
  let result = "";
  let count = 0;
  for (let i = characters.length - 1; i >= 0; i--) {
    result = characters[i] + result;
    count++;
    if (count % 3 === 0 && i !== 0) {
      result = "," + result;
    }
  }

  return result;
}

module.exports = {
  splitThousands,
  chunkArray,
  generateSlug,
  constructChototScrapingUrl,
  objectToQueryParams,
};
