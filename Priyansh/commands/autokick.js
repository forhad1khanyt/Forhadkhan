const fs = require("fs");
const path = __dirname + "/../../includes/data/";

const badWordsPath = path + "badWords.json";
const warnedUsersPath = path + "warnedUsers.json";
const adminUIDs = ["100067984247525"]; // এখানে শুধুমাত্র তোমার UID থাকবে

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(filePath));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "autokick",
  version: "2.0.0",
  hasPermission: 2,
  credits: "Modified by ChatGPT",
  description: "Warn then kick user when bad words are used. Admin-only word edit support.",
  commandCategory: "Admin",
  usages: "/autokick show | edit <old> <new>",
  cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body } = event;

  if (!body || adminUIDs.includes(senderID.toString())) return;

  const message = body.toLowerCase();
  const badWordsData = loadJSON(badWordsPath);
  const warnedData = loadJSON(warnedUsersPath);
  const matched = badWordsData.badWords?.some(word => message.includes(word));

  if (matched) {
    const warns = warnedData[senderID] || 0;

    if (warns === 0) {
      warnedData[senderID] = 1;
      saveJSON(warnedUsersPath, warnedData);
      return api.sendMessage(`⚠️ @${event.senderID}, নিষিদ্ধ শব্দ ব্যবহার করেছেন! পরের বার কিক করা হবে!`, threadID, null, [senderID]);
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
  const badWordsData = loadJSON(badWordsPath);

  if (!adminUIDs.includes(senderID.toString())) return api.sendMessage("❌ কেবল বট অ্যাডমিন এই কমান্ড চালাতে পারে।", threadID);

  const subCmd = args[0];

  if (subCmd === "show") {
    return api.sendMessage(`🔒 নিষিদ্ধ শব্দ:\n${badWordsData.badWords.join(", ")}`, threadID);
  }

  if (subCmd === "edit" && args[1] && args[2]) {
    const index = badWordsData.badWords.indexOf(args[1]);
    if (index === -1) return api.sendMessage(`❌ "${args[1]}" শব্দটি খুঁজে পাওয়া যায়নি।`, threadID);

    badWordsData.badWords[index] = args[2];
    saveJSON(badWordsPath, badWordsData);
    return api.sendMessage(`✅ "${args[1]}" এখন "${args[2]}" হয়েছে।`, threadID);
  }

  return api.sendMessage("❌ সঠিক কমান্ড লিখুন:\n/autokick show\n/autokick edit <পুরানো শব্দ> <নতুন শব্দ>", threadID);
};
