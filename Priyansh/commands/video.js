const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const https = require("https");
const http = require("http");

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

    // চেক করা হচ্ছে যে, আর্গুমেন্টে 'audio' বা 'video' দেওয়া হয়েছে কিনা।
    if (
      args.length > 1 &&
      (args[args.length - 1] === "audio" || args[args.length - 1] === "video")
    ) {
      type = args.pop();
      songName = args.join(" ");
    } else {
      songName = args.join(" ");
      type = "video"; // ডিফল্ট ভিডিও টাইপ
    }

    // ইউজারকে জানানো হচ্ছে যে ডাউনলোড প্রক্রিয়া চলছে
    const processingMessage = await api.sendMessage(
      "✅ Processing your request. Please wait...",
      event.threadID,
      null,
      event.messageID
    );

    try {
      // ইউটিউবে গানটি সার্চ করা হচ্ছে
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      // সর্বোচ্চ রেজাল্ট থেকে ভিডিও আইডি নেয়া হচ্ছে
      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;

      // API URL তৈরি করা হচ্ছে
      const apiKey = "priyansh-here";
      const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      // ডাউনলোড URL নিয়ে আসা হচ্ছে
      const downloadResponse = await axios.get(apiUrl);
      const downloadUrl = downloadResponse.data.downloadUrl;

      // গানটির নাম সুরক্ষিতভাবে তৈরি করা হচ্ছে (অক্ষর পরিবর্তন)
      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, "");
      const filename = `${safeTitle}.${type === "audio" ? "mp3" : "mp4"}`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      // ডাউনলোড ডিরেক্টরি তৈরি করা হচ্ছে যদি না থাকে
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // ফাইল ডাউনলোড এবং সেভ করার প্রক্রিয়া
      const file = fs.createWriteStream(downloadPath);

      await new Promise((resolve, reject) => {
        // যদি https থাকে, তবে https ব্যবহার করব, না হলে http
        const client = downloadUrl.startsWith("https") ? https : http;

        client.get(downloadUrl, (response) => {
          // যদি 301 বা 302 রিডাইরেক্ট কোড আসে, তখন নতুন URL তে রিডাইরেক্ট হবো
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            console.log(`Redirected to: ${redirectUrl}`);

            // নতুন রিডাইরেক্ট URL থেকে আবার ডাউনলোড করা হচ্ছে
            client.get(redirectUrl, (redirectResponse) => {
              if (redirectResponse.statusCode === 200) {
                redirectResponse.pipe(file);
                file.on("finish", () => {
                  file.close(resolve); // ডাউনলোড শেষ হলে ফাইল ক্লোজ হবে
                });
              } else {
                reject(
                  new Error(`Failed to download file. Status code: ${redirectResponse.statusCode}`)
                );
              }
            }).on("error", (error) => {
              fs.unlinkSync(downloadPath);
              reject(new Error(`Error downloading file: ${error.message}`));
            });
          } else if (response.statusCode === 200) {
            // যদি রিডাইরেক্ট না হয়, তাহলে ডাউনলোড হবে
            response.pipe(file);
            file.on("finish", () => {
              file.close(resolve); // ডাউনলোড শেষ হলে ফাইল ক্লোজ হবে
            });
          } else {
            reject(
              new Error(`Failed to download file. Status code: ${response.statusCode}`)
            );
          }
        }).on("error", (error) => {
          fs.unlinkSync(downloadPath);
          reject(new Error(`Error downloading file: ${error.message}`));
        });
      });

      // ডাউনলোড শেষ হলে রিঅ্যাকশন পরিবর্তন করা হচ্ছে
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // ইউজারকে ফাইল পাঠানো হচ্ছে
      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: `🖤 Title: ${topResult.title}\n\n Here is your ${
            type === "audio" ? "audio" : "video"
          } 🎧:`,
        },
        event.threadID,
        () => {
          fs.unlinkSync(downloadPath); // পাঠানোর পর ফাইলটি মুছে ফেলা হচ্ছে
          api.unsendMessage(processingMessage.messageID);
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
