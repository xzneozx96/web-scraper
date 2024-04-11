const config = require("../config");

const { scrapeChototItems } = require("../lib/chotot");
const { constructChototScrapingUrl, chunkArray } = require("../lib/utils");
const TrackingProduct = require("../models/tracking-product");

const getProducts = async (req, res) => {
  try {
    const trackingProducts = await TrackingProduct.find();

    console.log("on tracking products", trackingProducts);

    // run the scraper to get list of new items (items that have just been inserted to DB)
    const promises = trackingProducts.map((prod) => {
      const { keyword, source } = prod;

      const scrapingUrls = constructChototScrapingUrl(keyword);

      return scrapeChototItems({
        keyword,
        source,
        urls: scrapingUrls,
      });
    });

    const scrapedResults = await Promise.all(promises);

    let onNotifiedItems = [];

    for (let i = 0; i < scrapedResults.length; i++) {
      let result = scrapedResults[i];
      const { userId, lastNotiSentAt } = trackingProducts[i];

      let onSendingItems = [];

      if (!lastNotiSentAt) {
        onSendingItems = result?.allItems;
      } else {
        onSendingItems = result?.newItems;
      }

      // send the items to User's Facebook in CAROUSEL format
      if (onSendingItems && onSendingItems.length > 0) {
        const chunks = chunkArray(onSendingItems, 10);

        for (let k = 0; k < chunks.length; k++) {
          const subArray = chunks[k];

          let carouselElements = subArray.map((item) => ({
            title: item.title,
            subtitle: item.keyword + " - " + item.price,
            buttons: [
              {
                type: "web_url",
                url: item.link,
                title: "Xem ngay",
              },
            ],
          }));

          const carouselMsg = {
            recipient: {
              id: "6834211953364472",
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: carouselElements,
                },
              },
            },
          };

          console.log("about to send msg", JSON.stringify(carouselMsg));

          const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${config.fbAccessToken}`;
          const params = {
            method: "POST",
            body: JSON.stringify(carouselMsg),
            headers: { "Content-Type": "application/json" },
          };

          const req = await fetch(url, params);
          const body = await req.json();

          console.log("send msg success", body);

          // await delay(5000);
        }

        onNotifiedItems.push(...onSendingItems);

        // update lastNotiSentAt & lastNotifiedItems
        await TrackingProduct.findByIdAndUpdate(trackingProducts[i].id, {
          $set: {
            lastNotifiedItems: onSendingItems?.map(
              (item) => item.sourceProductID
            ),
            lastNotiSentAt: new Date(),
          },
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        onNotifiedItems,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

module.exports = {
  getProducts,
};
