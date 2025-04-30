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

// Only Admin gets romantic treatment
const ADMIN_ID = "100067984247525";

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, body } = event;
    let userMessage = args.join(" ");

    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();

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
        chatHistories[senderID].shift();
    }

    const fullConversation = chatHistories[senderID].join("\n");

    const personality = `Tumi ekta cute meye. Tumi cheleder sathe rosh kore roast kore, ar meyeder sathe boro boner moto kotha bolo.`;

    const prompt = `${personality}
Kotha choto rakho, ekdom 1-2 line e. Extra info dio na. Bot na, nijeke manush bolo. Arun tomake banai, tar channel: m.youtube.com/@mirrykal

${fullConversation}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(prompt)}`);
        let botReply = response.data.reply;

        if (!botReply || botReply.trim() === "") {
            botReply = "Aww, ami bujhte parlam na baby... kichu English e bolo na?";
        }

        if (botReply.startsWith("Sohana:")) {
            botReply = botReply.replace(/^Sohana:\s*/i, "");
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

    // Handle the auto-reply behavior regardless of admin or non-admin
    if (lowerBody.includes("sohana babu")) {
        if (!autoReplyEnabled[senderID]) {
            autoReplyEnabled[senderID] = true;
            return api.sendMessage("sohana hajir, bolo jan ki koro? 💖", threadID, messageID);
        } else {
            return api.sendMessage("achi to pagla, bolo...😘😘", threadID, messageID);
        }
    }

    if (lowerBody.includes("by babu") || lowerBody.includes("by apu")) {
        if (autoReplyEnabled[senderID]) {
            autoReplyEnabled[senderID] = false;
            chatHistories[senderID] = [];
            return api.sendMessage("love you ... abar dekha hobe babu! 😔", threadID, messageID);
        } else {
            return api.sendMessage("bye bolar o manei ache na jodio ami off e chilam... but okay! 😊😊", threadID, messageID);
        }
    }

    if (!autoReplyEnabled[senderID]) return;

    const args = body.split(" ");
    module.exports.run({ api, event, args });
};
