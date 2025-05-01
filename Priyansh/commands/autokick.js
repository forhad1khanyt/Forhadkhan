const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "autokick",
  version: "2.0.0",
  hasPermission: 2,
  credits: "Modified by ChatGPT",
  description: "Auto kick user when bad words are used, with warning system and admin exception",
  commandCategory: "Admin",
  usages: "[list/add/remove] [word]",
  cooldowns: 5,
};

const badWordsPath = path.join(__dirname, "autokick_badwords.json");
const warnedUsersPath = path.join(__dirname, "autokick_warned.json");
const adminUIDs = ["100067984247525"]; // শুধুমাত্র এই UID কে কিক না করে রিপ্লাই দেবে

// Helper Functions
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body } = event;
  if (!body) return;

  const message = body.toLowerCase();
  const badWordsData = loadJSON(badWordsPath);
  const warnedData = loadJSON(warnedUsersPath);
  const matched = badWordsData.badWords?.some(word => message.includes(word));

  if (matched) {
    // যদি এডমিন হয়
    if (adminUIDs.includes(senderID.toString())) {
      return api.sendMessage("ছি উস্তাদ, অন্যের জন্যে নিষিদ্ধ শব্দ আপনি ব্যবহার করতেছেন,,,,😞😞😞", threadID, event.messageID);
    }

    const warns = warnedData[senderID] || 0;

    if (warns === 0) {
      warnedData[senderID] = 1;
      saveJSON(warnedUsersPath, warnedData);
      return api.sendMessage(`⚠️ @${senderID}, নিষিদ্ধ শব্দ ব্যবহার করেছেন! পরের বার কিক করা হবে!`, threadID, null, [senderID]);
    } else {
      try {
        await api.removeUserFromGroup(senderID, threadID);
        delete warnedData[senderID];
        saveJSON(warnedUsersPath, warnedData);
        return api.sendMessage(`❌ @${senderID} কে গ্রুপ থেকে সরানো হয়েছে নিষিদ্ধ শব্দ ব্যবহারের জন্য।`, threadID);
      } catch {
        return api.sendMessage("❌ ইউজারকে রিমুভ করা যায়নি। হতে পারে সে অ্যাডমিন।", threadID);
      }
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;
  if (!adminUIDs.includes(senderID.toString())) {
    return api.sendMessage("❌ আপনি এই কমান্ড ব্যবহারের অনুমতি রাখেন না।", threadID);
  }

  const badWordsData = loadJSON(badWordsPath);

  if (args[0] === "list") {
    const list = badWordsData.badWords || [];
    return api.sendMessage(`📛 নিষিদ্ধ শব্দের তালিকা:\n${list.join(", ") || "কোনো শব্দ নেই।"}`, threadID);
  }

  if (args[0] === "add" && args[1]) {
    if (!badWordsData.badWords) badWordsData.badWords = [];
    badWordsData.badWords.push(args[1].toLowerCase());
    saveJSON(badWordsPath, badWordsData);
    return api.sendMessage(`✅ শব্দ "${args[1]}" নিষিদ্ধ তালিকায় যোগ হয়েছে।`, threadID);
  }

  if (args[0] === "remove" && args[1]) {
    if (!badWordsData.badWords) return api.sendMessage("❌ তালিকায় কোনো শব্দ নেই।", threadID);
    badWordsData.badWords = badWordsData.badWords.filter(word => word !== args[1].toLowerCase());
    saveJSON(badWordsPath, badWordsData);
    return api.sendMessage(`❌ শব্দ "${args[1]}" তালিকা থেকে সরানো হয়েছে।`, threadID);
  }

  return api.sendMessage("❓ ব্যবহার:\n• autokick list\n• autokick add <word>\n• autokick remove <word>", threadID);
};
