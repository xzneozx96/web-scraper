const mongoose = require("mongoose");

const ScrapedProductSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    sourceProductID: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
    lastNotiSentAt: {
      type: Date,
      required: false,
    },
    lastNotifiedItems: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
  // id String @id @default(auto()) @map("_id") @db.ObjectId

  // keyword String
  // source String
  // sourceProductID String
  // title String
  // price String
  // link String
  // location String
  // postedAt String

  // createdAt DateTime @default(now())
  // updatedAt DateTime @updatedAt
);

module.exports = mongoose.model(
  "scraped-product",
  ScrapedProductSchema,
  "ScrapedProduct"
);
