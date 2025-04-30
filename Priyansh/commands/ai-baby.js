const axios = require("axios");

module.exports.config = {
    name: "sohana",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Kawsar",
    description: "Romantic Girlfriend Sohana",
    commandCategory: "ai",
    usages: "[ask/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

const API_URL = "https://gemini-5e9s.onrender.com/chat";

const chatHistories = {};
const autoReplyEnabled = {};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, body } = event;
    let userMessage = args.join(" ");

    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();

    // Only trigger when auto reply is enabled for the user
    if (!autoReplyEnabled[senderID]) return;
    if (!isReplyingToAI && !userMessage.toLowerCase().includes("sohana")) return;

    if (!chatHistories[senderID]) chatHistories[senderID] = [];

    if (isReplyingToAI) {
        userMessage = messageReply.body + "\nUser: " + body;
        chatHistories[senderID].push(`User: ${userMessage}`);
    } else {
        chatHistories[senderID].push(`User: ${userMessage}`);
    }

    if (chatHistories[senderID].length > 5) {
        chatHistories[senderID].shift(); // Keep the chat history to a manageable size
    }

    const fullConversation = chatHistories[senderID].join("\n");

    const personality = `Tumi ekta cute meye, romatic, naughty. Tumi Bangla, English, Banglish mix kore kotha bolo, kothao rosh koro, kothao romance.`;

    const prompt = `${personality}
Kotha choto rakho, ekdom 1-2 line e. Extra info dio na. Bot na, nijeke manush bolo.

${fullConversation}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(prompt)}`);
        let botReply = response.data.reply;

        if (!botReply || botReply.trim() === "") {
            botReply = "Aww, ami bujhte parlam na baby... kichu English e bolo na?";
        }

        chatHistories[senderID].push(` ${botReply}`);

        setTimeout(() => {
            api.sendMessage(botReply, threadID, messageID); // Send bot's reply to the user
            api.setMessageReaction("✅", messageID, () => {}, true);
        }, 2000);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Oops baby! Ami confused hoye gelam... ekto pore try koro!", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;

    const lowerBody = body.toLowerCase();

    // Enable auto reply when "sohana on" is sent
    if (lowerBody === "sohana on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("sohana hajir, bolo jan ki koro? 💖", threadID, messageID);
    }

    // Disable auto reply when "sohana off" is sent
    if (lowerBody === "sohana off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("sohana off hoye gese, abaro dekha hobe babu! 😔", threadID, messageID);
    }

    if (!autoReplyEnabled[senderID]) return;
    if (messageReply && messageReply.senderID === api.getCurrentUserID()) return;

    // Continue with existing functionality to reply to user
    const args = body.split(" ");
    module.exports.run({ api, event, args });
};
