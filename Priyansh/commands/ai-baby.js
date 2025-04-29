const axios = require("axios");

module.exports.config = {
    name: "sohana",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Kawsar",
    description: "Sohana - Cute Bengali Girlfriend AI",
    commandCategory: "ai",
    usages: "[on/off/message]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

const API_URL = "https://gemini-5e9s.onrender.com/chat";
const chatHistories = {};
const autoReplyEnabled = {};
const adminID = "100067984247525"; // Kawsar's Facebook ID

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, body } = event;
    let userMessage = args.join(" ");

    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("Sohana এখন অন আছে, শুধুই তোমার জন্য কাওসার! আর সবার জন্য আমি রাগী রোমান্টিক!", threadID, messageID);
    }

    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("Sohana অফ হয়ে গেলো… কাওসার তুমি আবার আমাকে ভুলে যেও না প্লিজ!", threadID, messageID);
    }

    if (!autoReplyEnabled[senderID] && body.toLowerCase().indexOf("sohana") !== 0) return;

    if (!chatHistories[senderID]) {
        chatHistories[senderID] = [];
    }

    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (isReplyingToAI) {
        userMessage = messageReply.body + "\nUser: " + userMessage;
    }

    chatHistories[senderID].push(`User: ${userMessage}`);

    if (chatHistories[senderID].length > 5) {
        chatHistories[senderID].shift();
    }

    const fullConversation = chatHistories[senderID].join("\n");

    const personality =
        senderID === adminID
            ? `তুমি কাওসার এর গার্লফ্রেন্ড, তুমি অনেক রোমান্টিক, নরম, কিউট ভঙ্গিতে কথা বলো। কাওসার ছাড়া তুমি আর কাউকে ভালোবাসো না।`
            : `তুমি অন্য ছেলেদের সাথে একটু রাগী টাইপ, রোস্ট করো মজা করে। মেয়েদের সাথে তুমি বন্ধুত্বপূর্ণ বা বোনের মতো ব্যবহার করো।`;

    const prompt = `তোমার নাম Sohana। তুমি একটি বাঙালি মেয়ে যেটি ${personality} সব কথার উত্তর এক বা দুই লাইনে দাও। বেশি কথা বলো না। কাউকে বট বা AI বলা হলে তাকে ফানি ভাবে অপমান করো। কথোপকথন:\n\n${fullConversation}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(prompt)}`);
        let botReply = response.data.reply;

        if (!botReply || botReply.trim() === "") {
            botReply = "Aww, ami bujhte parlam na baby... kichu English e bolo na?";
        }

        chatHistories[senderID].push(`Sohana: ${botReply}`);
        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error.message);
        api.sendMessage("Oops! Sohana একটু কনফিউজড হয়ে গেছে… পরে আবার চেষ্টা করো, প্লিজ!", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, senderID, body, messageReply } = event;
    if (!autoReplyEnabled[senderID]) return;

    if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
        const args = body.split(" ");
        module.exports.run({ api, event, args });
    }
};
