const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const https = require("https");
const http = require("http");  // http প্রোটোকল হ্যান্ডেল করার জন্য নতুন করে এই লাইব্রেরি যোগ করা হলো

module.exports = {
  config: {
    name: "video",
    version: "1.0.3",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Download YouTube song from keyword search and link",
    commandCategory: "Media",
    usages: "[songName] [type]",
    cooldowns: 5,
    dependencies: {
      "node-fetch": "",
      "yt-search": "",
    },
  },

  run: async function ({ api, event, args }) {
    let songName, type;

    // প্রথমে song name এবং type (audio/video) বের করা হচ্ছে
    if (
      args.length > 1 &&
      (args[args.length - 1] === "audio" || args[args.length - 1] === "video")
    ) {
      type = args.pop();  // type audio/video হতে পারে
      songName = args.join(" ");
    } else {
      songName = args.join(" ");
      type = "video";  // যদি type না দেয়া থাকে, default video হবে
    }

    // Processing message পাঠানো
    const processingMessage = await api.sendMessage(
      "✅ Processing your request. Please wait...",
      event.threadID,
      null,
      event.messageID
    );

    try {
      // YouTube এ গানটি খোঁজা হচ্ছে
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      // শীর্ষ ফলাফল থেকে ভিডিও আইডি নেয়া হচ্ছে
      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;

      // API URL তৈরী করা হচ্ছে ডাউনলোডের জন্য
      const apiKey = "priyansh-here";
      const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      // API থেকে ডাউনলোড লিংক পাওয়া হচ্ছে
      const downloadResponse = await axios.get(apiUrl);
      const downloadUrl = downloadResponse.data.downloadUrl;

      // ফাইলের নাম তৈরী করা হচ্ছে
      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, ""); // গান বা ভিডিও টাইটেল পরিষ্কার করা হচ্ছে
      const filename = `${safeTitle}.${type === "audio" ? "mp3" : "mp4"}`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      // ডাউনলোড ফোল্ডার নিশ্চিত করা হচ্ছে
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // ডাউনলোড ফাইল তৈরি হচ্ছে
      const file = fs.createWriteStream(downloadPath);

      await new Promise((resolve, reject) => {
        // এখানে http এবং https প্রোটোকল সাপোর্ট করা হচ্ছে
        const client = downloadUrl.startsWith("https") ? https : http;  // যদি https থাকে তবে https ব্যবহার করবে, অন্যথায় http

        client.get(downloadUrl, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);  // ফাইলটি ডাউনলোড হচ্ছে
            file.on("finish", () => {
              file.close(resolve);  // ডাউনলোড শেষ হলে ফাইলটি বন্ধ হবে
            });
          } else {
            reject(
              new Error(`Failed to download file. Status code: ${response.statusCode}`)
            );
          }
        }).on("error", (error) => {
          fs.unlinkSync(downloadPath);  // কোনো সমস্যা হলে ডাউনলোড ফাইল মুছে ফেলা হবে
          reject(new Error(`Error downloading file: ${error.message}`));
        });
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // ফাইলটি পাঠিয়ে দেয়া হচ্ছে
      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: `🖤 Title: ${topResult.title}\n\n Here is your ${
            type === "audio" ? "audio" : "video"
          } 🎧:`,
        },
        event.threadID,
        () => {
          fs.unlinkSync(downloadPath); // পাঠানোর পর ফাইলটি মুছে ফেলা হবে
          api.unsendMessage(processingMessage.messageID);  // প্রক্রিয়া শেষ হলে "processing" বার্তাটি মুছে ফেলা হবে
        },
        event.messageID
      );
    } catch (error) {
      console.error(`Failed to download and send song: ${error.message}`);
      api.sendMessage(
        `Failed to download song: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
