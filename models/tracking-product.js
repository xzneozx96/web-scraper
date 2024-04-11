const mongoose = require("mongoose");

const TrackingProductSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    slug: {
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
);

module.exports = mongoose.model(
  "tracking-product",
  TrackingProductSchema,
  "TrackingProduct"
);
