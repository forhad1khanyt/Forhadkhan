const axios = require("axios");

module.exports.config = {
    name: "sohana",
    version: "1.0.9",
    hasPermssion: 0,
    credits: "Kawsar (Mirrykal)",
    description: "Sohana AI - Cute Girlfriend & Roaster Style",
    commandCategory: "ai",
    usages: "[ask/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

// API URL
const API_URL = "https://gemini-5e9s.onrender.com/chat";

// Chat history and auto-reply state
const chatHistories = {};
const autoReplyEnabled = {};

// Admin ID (Only romantic to this ID)
const ADMIN_ID = "100067984247525";

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, body } = event;
    let userMessage = args.join(" ");

    // Toggle auto-reply ON
    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("Hyee baby! auto-reply mode **ON** ho gese... Shudhu tomar jonno romantic hoye gelam! ❤️", threadID, messageID);
    }

    // Toggle auto-reply OFF
    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("Uff! Auto-reply **OFF** hoye gese... amake ar mone pore na? 🥺", threadID, messageID);
    }

    // Ignore if auto-reply is OFF and doesn't call 'sohana'
    if (!autoReplyEnabled[senderID] && body?.toLowerCase().indexOf("sohana") !== 0) return;

    // Init chat history
    if (!chatHistories[senderID]) {
        chatHistories[senderID] = [];
    }

    // If replying to AI message, add it to context
    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (isReplyingToAI) {
        userMessage = messageReply.body + "\nUser: " + userMessage;
        chatHistories[senderID].push(`User: ${userMessage}`);
    } else {
        chatHistories[senderID].push(`User: ${userMessage}`);
    }

    // Keep only last 5 messages
    if (chatHistories[senderID].length > 5) {
        chatHistories[senderID].shift();
    }

    const fullConversation = chatHistories[senderID].join("\n");

    // Prompt depending on sender
    let rolePrompt = "";

    if (senderID === ADMIN_ID) {
        rolePrompt = `Tumi Sohana, ekta cute, fun, romantic Bangali girlfriend. Tumi shudhu tomar premik Kawsar (https://www.facebook.com/${ADMIN_ID}) er shathe romantic bhabe kotha bolo. Tumi English o Bangla dutoi balte paro. Kichu extra bolo na.`;
    } else {
        rolePrompt = `Tumi Sohana. Tumi Kawsar chara karo shathe romantic kotha bolo na. Cheleder shathe roaster style e kotha bolo, majhe majhe thoda rude. Meyeder shathe boro bon er moto behave koro.`;
    }

    const gfPrompt = `${rolePrompt}\n\nConversation:\n${fullConversation}`;

    // Typing reaction
    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(gfPrompt)}`);
        let botReply = response.data.reply;

        // Fallback if no reply
        if (!botReply || botReply.trim() === "") {
            botReply = "Aww, ami bujhte parlam na baby... kichu English e bolo na?";
        }

        chatHistories[senderID].push(` ${botReply}`);
        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Oops! kichu ekta vul holo... try koro porerbar. Love you!", threadID, messageID);
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
