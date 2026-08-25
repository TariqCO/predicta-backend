import mongoose from "mongoose";

const cryptoSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },

    prediction: {
      directions: [
        {
          timeframe: { type: String, enum: ["24", "7", "1"], required: true },
          value: { type: String, enum: ["positive", "negative"], required: true },
          predictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],

      texts: [
        {
          timeframe: { type: String, enum: ["24", "7", "1"], required: true },
          content: { type: String, required: true },
          predictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],

      confidence: [
        {
          timeframe: { type: String, enum: ["24", "7", "1"], required: true },
          value: { type: String, required: true },
          predictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],

      targetPrices: [
        {
          timeframe: { type: String, enum: ["24", "7", "1"], required: true },
          value: { type: Number, required: true },
          predictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],

      fulfillmentTimes: [
        {
          timeframe: { type: String, enum: ["24", "7", "1"], required: true },
          date: { type: Date, required: true },
          predictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
          },
        },
      ],

      fulfilled: [
        {
          timeframe: { type: String, enum: ["24", "7", "1"] },
          status: { type: Boolean, default: false },
          predictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const CryptoModel = mongoose.model("Crypto", cryptoSchema);
