module.exports.config = {
  name: "autokick",
  version: "1.0.0",
  hasPermission: 2,
  credits: "Modified by ChatGPT",
  description: "Automatically kicks users from group if they use banned words",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5
};

const badWords = ["fuck", "bot", "spam", "nude", "idiot", "noob"]; // চাইলে এখানে আরও শব্দ যোগ করো

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, body } = event;

  // যদি বার্তা না থাকে তাহলে ফাঁকা রিটার্ন
  if (!body) return;

  const message = body.toLowerCase();

  // যদি কোনো নিষিদ্ধ শব্দ পাওয়া যায়
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

// এই কমান্ডটি সরাসরি রান করার জন্য নয়, তাই ফাঁকা রাখা হয়েছে
module.exports.run = () => {};
