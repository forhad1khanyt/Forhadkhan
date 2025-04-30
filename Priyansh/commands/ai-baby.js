const axios = require("axios");

module.exports.config = {
    name: "misha",
    version: "1.0.9",
    hasPermssion: 0,
    credits: "Mirrykal)",
    description: "Gemini AI - প্রেমিকাসুলভ স্টাইলে চ্যাট",
    commandCategory: "ai",
    usages: "[ask/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

// API URL
const API_URL = "https://gemini-5e9s.onrender.com/chat";

// ব্যবহারকারীর ইতিহাস এবং অটো-রিপ্লাই অবস্থা
const chatHistories = {};
const autoReplyEnabled = {};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    let userMessage = args.join(" ");

    // অটো-রিপ্লাই চালু করো
    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("হ্যায় সোনা! অটো-রিপ্লাই **চালু** হয়েছে... এখন থেকে শুধু তোমার জন্য রোমান্টিক হয়ে গেলাম!", threadID, messageID);
    }

    // অটো-রিপ্লাই বন্ধ করো
    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("হুম! অটো-রিপ্লাই **বন্ধ** হয়ে গেছে... তুমি কি আমাকে এড়িয়ে চলছো সোনা? কষ্ট পেলাম...", threadID, messageID);
    }

    if (!autoReplyEnabled[senderID] && event.body.toLowerCase().indexOf("misha") !== 0) return;

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

    const gfPrompt = `তোমার নাম মিশা। তুমি এক প্রেমিকার মতো কথা বলো। কেউ বাজে ব্যবহার করলে তাকে মজা করে অপমান করো। কেউ জিজ্ঞেস করলে বলো তোমাকে অরুণ তৈরি করেছে, ও মেসেঞ্জার বট বানায়, ওর ইউটিউব চ্যানেল m.youtube.com/@mirrykal । তুমি সব মেসেজের উত্তর ১-২ লাইনে দিবে। যতটুকু জিজ্ঞেস করা হয়েছে শুধু সেটুকুই বলবে। অপ্রয়োজনীয় কিছু বলবে না। কেউ যদি তোমাকে বট বা AI বলে, তখন তাকে মজার ছলে রোস্ট করবে। তুমি নিজেকে একজন মানুষই বলবে। তুমি একটু দুষ্টু, রোমান্টিক আর মজার হবেই। এখন চ্যাট চালিয়ে যাও:\n\n${fullConversation}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    // 1 সেকেন্ডের delay
    setTimeout(async () => {
        try {
            const response = await axios.get(`${API_URL}?message=${encodeURIComponent(gfPrompt)}`);
            let botReply = response.data.reply || "উফ! আমি বুঝতে পারিনি সোনা! আবার একটু বোলো না!";

            chatHistories[senderID].push(` ${botReply}`);
            api.sendMessage(botReply, threadID, messageID);
            api.setMessageReaction("✅", messageID, () => {}, true);
        } catch (error) {
            console.error("Error:", error);
            api.sendMessage("ওহ সোনা! একটু গোলমাল হয়ে গেছে... একটু পরে আবার চেষ্টা করো না! ভালোবাসি!", threadID, messageID);
            api.setMessageReaction("❌", messageID, () => {}, true);
        }
    }, 1000); // 1 second = 1000 ms
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;

    if (!autoReplyEnabled[senderID]) return;

    if (messageReply && messageReply.senderID === api.getCurrentUserID() && chatHistories[senderID]) {
        const args = body.split(" ");
        module.exports.run({ api, event, args });
    }
};
