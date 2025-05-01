const axios = require("axios");

module.exports.config = {
    name: "ai",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "BlackBoxAi by Priyansh",
    commandCategory: "ai",
    usages: "[ask]",
    cooldowns: 2,
    dependecies: {
        "axios": "1.4.0"
    }
};

module.exports.run = async function ({ api, event, args, Users }) {

  const { threadID, messageID } = event;
  const query = encodeURIComponent(args.join(" "));
  var name = await Users.getNameUser(event.senderID);

  // যদি কোনো প্রশ্ন না থাকে
  if (!args[0]) return api.sendMessage("Please type a message...", threadID, messageID);

  api.sendMessage("Searching for an answer, please wait...", threadID, messageID);

  try {
    // Reaction set করা হচ্ছে
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    // BlackBoxAi API থেকে ডেটা নিয়ে আসা
    const res = await axios.get(`https://priyansh-ai.onrender.com/api/blackboxai?query=${encodeURIComponent(query)}`);
    const data = res.data.priyansh;

    // রেসপন্স না আসলে
    if (!data) {
      api.sendMessage("Sorry, I couldn't understand that. Please try again with another question.", event.threadID, event.messageID);
    } else {
      // AI এর রেসপন্স পাঠানো
      api.sendMessage(data, event.threadID, event.messageID);
    }

    // সফল হলে React ✅ দেওয়া
    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (error) {
    console.error('Error fetching data:', error);
    api.sendMessage("An error occurred while fetching data. Please try again later.", event.threadID, event.messageID);
  }

  // নতুন মেসেজে AI রিপ্লাই চেকিং
  api.listenForReplies(event.threadID, event.messageID, async function (replyEvent) {
    const replyMessage = replyEvent.message.text.toLowerCase();

    // রিপ্লাইয়ের মধ্যে যদি কোন নির্দিষ্ট শব্দ থাকে (যেমন "রোবট")
    if (replyMessage.includes("রোবট")) {
      api.sendMessage("হ্যাঁ, আমি রোবট, কিন্তু আমি সাহায্য করতে পারি!", replyEvent.threadID, replyEvent.messageID);
    }
    // এখানে আরো কন্ডিশন এবং উত্তর দিতে পারো

    // যদি ইউজার আবার মেসেজ পাঠায়, AI তার রিপ্লাই করবে
    else {
      api.sendMessage("আপনি আবার কিছু লিখেছেন! আমি আপনার প্রশ্নের উত্তর দিব।", replyEvent.threadID, replyEvent.messageID);
    }
  });
};
