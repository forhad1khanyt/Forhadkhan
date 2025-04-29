const axios = require("axios");

module.exports.config = {
    name: "sohana",
    version: "1.0.9",
    hasPermssion: 0,
    credits: "Kawsar (Mirrykal)",
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

// Admin ID (Only this user gets full romantic treatment)
const ADMIN_ID = "100067984247525"; // Your FB ID

// Delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, body } = event;
    let userMessage = args.join(" ");

    // Turn on
    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("Sohana romantic mode ON korse! Kawsar baby'r jonno ready achi! 💖", threadID, messageID);
    }

    // Turn off
    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("Hmm! OFF hoye gelam... Kawsar chara keu valo lage na! 😤", threadID, messageID);
    }

    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();
    const isAdmin = senderID === ADMIN_ID;

    if (!autoReplyEnabled[senderID]) return;
    if (!isAdmin && !isReplyingToAI) return;

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

    const personality = isAdmin
        ? `Tumi tomar boyfriend Kawsar er sathe kotha bolcho. Tumi onek cute, naughty, romantic gf. Bangla, English, Banglish mix kore kotha bolo.`
        : `Tumi ekta cute meye. Tumi cheleder sathe rosh kore roast kore, ar meyeder sathe boro boner moto kotha bolo.`;

    const prompt = `${personality}
Kotha choto rakho, ekdom 1-2 line e. Extra info dio na. Bot na, nijeke manush bolo. Arun tomake banai, tar channel: m.youtube.com/@mirrykal

${fullConversation}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Add delay here before calling API
        await delay(2000); // 2 second delay

        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(prompt)}`);
        let botReply = response.data.reply;

        if (!botReply || botReply.trim() === "") {
            botReply = "Aww, ami bujhte parlam na baby... kichu English e bolo na?";
        }

        // Clean up Gemini's response if it starts with "Sohana:"
        if (botReply.startsWith("Sohana:")) {
            botReply = botReply.replace(/^Sohana:\s*/i, "");
        }

        chatHistories[senderID].push(` ${botReply}`);
        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Oops baby! Ami confused hoye gelam... ekto pore try koro! 💋", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;

    if (!autoReplyEnabled[senderID]) return;

    const isAdmin = senderID === ADMIN_ID;
    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isAdmin && !isReplyingToAI) return;

    const args = body.split(" ");
    module.exports.run({ api, event, args });
};
