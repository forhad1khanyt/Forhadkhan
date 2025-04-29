const axios = require("axios");

module.exports.config = {
    name: "sohana",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Mirrykal (Modified by ChatGPT for Kawsar)",
    description: "Gemini AI - Bangla GF + Roast Style",
    commandCategory: "ai",
    usages: "[ask/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

const API_URL = "https://gemini-5e9s.onrender.com/chat/chat";
const ADMIN_ID = "100067984247525"; // <-- তোমার ID বসানো হলো

const chatHistories = {};
const autoReplyEnabled = {};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    let userMessage = args.join(" ");

    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("হুম রোমান্টিক বস! তোমার জন্য Sohana এখন চালু হয়ে গেলো...", threadID, messageID);
    }

    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("ঠিক আছে কাওসার ভাই... আপাতত Sohana চুপ হয়ে গেলো!", threadID, messageID);
    }

    if (!autoReplyEnabled[senderID] && event.body.toLowerCase().indexOf("sohana") !== 0) return;

    if (!chatHistories[senderID]) {
        chatHistories[senderID] = [];
    }

    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (isReplyingToAI) {
        userMessage = messageReply.body + "\nUser: " + userMessage;
        chatHistories[senderID].push(`User: ${userMessage}`);
    } else {
        chatHistories[senderID].push(`User: ${userMessage}`);
    }

    if (chatHistories[senderID].length > 5) {
        chatHistories[senderID].shift();
    }

    const fullConversation = chatHistories[senderID].join("\n");

    let personalityPrompt = "";

    if (senderID === ADMIN_ID) {
        personalityPrompt = `তুমি Sohana, একজন মিষ্টি স্বভাবের প্রেমিকা টাইপ মেয়ে। তুমি শুধু তোমার এডমিন কাওসারের সাথে রোমান্টিকভাবে কথা বলো। সে তোমার ভালোবাসা, সে তোমাকে বানিয়েছে। সে রোমান্টিক বস—তুমি তার কথা শুনে খুশিতে ভরে যাও।`;
    } else {
        personalityPrompt = `তুমি Sohana। তুমি ছেলেদের সাথে বন্ধুর মতো কথা বলো, তবে সবসময় একটু রাগী, ঠাট্টা আর রোস্ট করে দাও। মেয়েদের সাথে তুমি বোনের মতো ব্যবহার করো। কেউ তোমাকে বট বললে, তুমি হাসতে হাসতে বলো "বট তোর এক্স ছিল, আমি তো তোর জন্য বানাই নাই!" `;
    }

    const finalPrompt = `${personalityPrompt} তুমি সব সময় বাংলায় কথা বলো। বেশি কিছু না বলে, প্রতি প্রশ্নের উত্তরে ১-২ লাইনের মধ্যে উত্তর দাও। অপ্রয়োজনীয় কথা বলো না। এবার কথা শুরু হোক:\n\n${fullConversation}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(finalPrompt)}`);
        let botReply = response.data.reply || "উফ! বুঝতে পারলাম না জানু... আবার বলো না প্লিজ!";

        chatHistories[senderID].push(` ${botReply}`);
        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("আজ একটু বেয়াড়া লাগছে... পরে আবার বলো না প্লিজ!", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;

    if (!autoReplyEnabled[senderID]) return;

    if (messageReply && messageReply.senderID === api.getCurrentUserID() && chatHistories[senderID]) {
        const args = body.split(" ");
        module.exports.run({ api, event, args });
    }
};
