module.exports.config = {
  name: "autokick",
  version: "1.1.0",
  hasPermission: 0, // সাধারণ ইউজারও এই কমান্ড ব্যবহার করতে পারবে
  credits: "Modified by ChatGPT",
  description: "Auto kick users who use bad words (except owner)",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5,
};

// নিষিদ্ধ শব্দের লিস্ট
const badWords = ["fuck", "bot", "spam", "nude", "idiot"];

// Owner বা যাদের exempt করতে চাও তাদের UID বসাও
const exemptUsers = ["100067984247525"]; // তোর UID

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, body } = event;
  if (!body) return;

  const message = body.toLowerCase();
  const botID = api.getCurrentUserID();

  // যদি বট নিজে মেসেজ পাঠায় বা exempt UID হয়, তাহলে কিছু করবি না
  if (senderID == botID || exemptUsers.includes(senderID)) return;

  // যদি নিষিদ্ধ শব্দ থাকে
  if (badWords.some(word => message.includes(word))) {
    try {
      await api.removeUserFromGroup(senderID, threadID);
      await api.sendMessage(`⚠️ নিষিদ্ধ শব্দ ব্যবহারের কারণে একজন সদস্যকে গ্রুপ থেকে রিমুভ করা হয়েছে।`, threadID);
      console.log(`[AUTO KICK] Removed ${senderID} for: ${message}`);
    } catch (err) {
      console.log(`[AUTO KICK ERROR] Couldn't remove ${senderID}. Possibly admin or lack of permission.`);
    }
  }
};

module.exports.run = () => {};
