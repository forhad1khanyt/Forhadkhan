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

    if (userMessage.toLowerCase() === "on") {
        if (autoReplyEnabled[senderID]) {
            return api.sendMessage("Already ON ache baby... abar bolish keno? Tui na!", threadID, messageID);
        }
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("Sohana romantic mode ON korse! Ready achi babu! 💖", threadID, messageID);
    }

    if (userMessage.toLowerCase() === "off") {
        if (!autoReplyEnabled[senderID]) {
            return api.sendMessage("Already OFF ache baby... abar by bolish keno?", threadID, messageID);
        }
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("Hmm! OFF hoye gelam... abar dekha hobe! 😔", threadID, messageID);
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
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(prompt)}`);
        let botReply = response.data.reply;

        if (!botReply || botReply.trim() === "") {
            botReply = "Aww, ami bujhte parlam na baby... kichu English e bolo na?";
        }

        if (botReply.startsWith("Sohana:")) {
            botReply = botReply.replace(/^Sohana:\s*/i, "");
        }

        chatHistories[senderID].push(` ${botReply}`);

        // Adding delay before sending message
        setTimeout(() => {
            api.sendMessage(botReply, threadID, messageID);
            api.setMessageReaction("✅", messageID, () => {}, true);
        }, 2000); // 2000 milliseconds = 2 seconds delay
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Oops baby! Ami confused hoye gelam... ekto pore try koro! 💋", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;

    const isAdmin = senderID === ADMIN_ID;
    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();
    const lowerBody = body.toLowerCase();

    // Trigger without prefix
    if (isAdmin && lowerBody.includes("sohana babu")) {
        if (autoReplyEnabled[senderID]) {
            return api.sendMessage("Already ON ache babu... abar abar bolish keno? Tui na ekdom pagla!", threadID, messageID);
        } else {
            autoReplyEnabled[senderID] = true;
            return api.sendMessage("Sohana romantic mode ON korse! Tomar jonno ready achi! 💖", threadID, messageID);
        }
    }

    if (isAdmin && lowerBody.includes("by babu")) {
        if (!autoReplyEnabled[senderID]) {
            return api.sendMessage("Ami toh already OFF ache... abar by bolish keno baby?", threadID, messageID);
        } else {
            autoReplyEnabled[senderID] = false;
            chatHistories[senderID] = [];
            return api.sendMessage("Hmm! OFF hoye gelam... abar dekha hobe babu! 😔", threadID, messageID);
        }
    }

    if (!isAdmin && lowerBody.includes("sohana apu")) {
        if (autoReplyEnabled[senderID]) {
            return api.sendMessage("Ami toh already on achi! Eto excited keno?", threadID, messageID);
        } else {
            autoReplyEnabled[senderID] = true;
            return api.sendMessage("Hmm! On hoye gelam, dekhi tumi ki bolo!", threadID, messageID);
        }
    }

    if (!isAdmin && lowerBody.includes("by apu")) {
        if (!autoReplyEnabled[senderID]) {
            return api.sendMessage("Ami toh on-i chhilam na... abar off korte ashcho keno?", threadID, messageID);
        } else {
            autoReplyEnabled[senderID] = false;
            chatHistories[senderID] = [];
            return api.sendMessage("Bye re! Off hoye gelam!", threadID, messageID);
        }
    }

    if (!autoReplyEnabled[senderID]) return;
    if (!isAdmin && !isReplyingToAI) return;

    const args = body.split(" ");
    module.exports.run({ api, event, args });
};
