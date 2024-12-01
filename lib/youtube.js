const axios = require("axios");
const he = require("he");
const striptags = require("striptags");

const getVideoId = async (video) => {
  // video can be an ID or a link like https://www.youtube.com/watch?v=fOBN8OR8YZA&t=10s

  let video_id = "";
  if (video.startsWith("http")) {
    const url = new URL(video);
    // https://www.youtube.com/watch?v=0chZFIZLR_0
    // https://youtu.be/0chZFIZLR_0?si=-Gp9e_RKG3g1SdVG
    video_id = url.searchParams.get("v") || url.pathname.slice(1);
  } else {
    video_id = resource;
  }

  return video_id;
};

const getSubtitleFromVideo = async (video_id) => {
  const html = await getHTML(video_id);
  // const subtitle = await getSubtitleWithDuration(html);
  const subtitle = await getPlainTextSubtitle(html);

  return subtitle;
};

const getHTML = async (video_id) => {
  const { data: html } = await axios.get(
    `https://youtube.com/watch?v=${video_id}`
  );

  return html;
};

const getSubtitleWithDuration = async (html) => {
  if (!html.includes("captionTracks")) {
    throw new Error(`Could not find captions for video`);
  }

  const regex = /https:\/\/www\.youtube\.com\/api\/timedtext[^"]+/;

  const [url] = html.match(regex);

  console.log("transcript url", url);

  if (!url) throw new Error(`Could not find captions`);

  const obj = JSON.parse(`{"url": "${url}"}`);

  const subtitle_url = obj.url;

  const transcriptResponse = await axios.get(subtitle_url);
  const transcript = transcriptResponse.data;

  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', "")
    .replace("</transcript>", "")
    .split("</text>")
    .filter((line) => line && line.trim())
    .map((line) => {
      const startRegex = /start="([\d.]+)"/;
      const durRegex = /dur="([\d.]+)"/;

      const startMatch = startRegex.exec(line);
      const durMatch = durRegex.exec(line);

      const start = startMatch[1];
      const dur = durMatch[1];

      const htmlText = line
        .replace(/<text.+>/, "")
        .replace(/&amp;/gi, "&")
        .replace(/<\/?[^>]+(>|$)/g, "");
      const decodedText = he.decode(htmlText);
      const text = striptags(decodedText);

      return { start, dur, text };
    });

  return lines;
};

const getPlainTextSubtitle = async (html) => {
  if (!html.includes("captionTracks")) {
    throw new Error(`Could not find captions for video`);
  }

  const regex = /https:\/\/www\.youtube\.com\/api\/timedtext[^"]+/;

  const [url] = html.match(regex);
  console.log("transcript url", url);

  if (!url) throw new Error(`Could not find captions`);

  const obj = JSON.parse(`{"url": "${url}"}`);

  const subtitle_url = obj.url;

  const transcriptResponse = await axios.get(subtitle_url);
  const transcript = transcriptResponse.data;

  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', "")
    .replace("</transcript>", "")
    .split("</text>")
    .filter((line) => line && line.trim())
    .map((line) => {
      const htmlText = line
        .replace(/<text.+>/, "")
        .replace(/&amp;/gi, "&")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/[\r\n]/g, "") // Remove line breaks
        .replace(/\([^)]*\)/g, "") // Remove text within parentheses
        .replace(/\[[^\]]*\]/g, "") // Remove text within square brackets
        .replace(/\[|\]/g, "") // Remove square brackets
        .replace(/\(|\)/g, ""); // Remove parentheses

      const decodedText = he.decode(htmlText);
      const text = striptags(decodedText);

      return text; // Remove special characters
    });

  return lines.join(", ");
};

module.exports = { getSubtitleFromVideo };
