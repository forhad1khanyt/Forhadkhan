const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "autokick_badwords.json");  // ফাইলের নাম এখানে পরিবর্তন করেছি
const ownerID = "100067984247525"; // তোমার UID

module.exports.config = {
  name: "badword",
  version: "1.0.0",
  hasPermission: 2,
  credits: "Modified by ChatGPT",
  description: "Add, remove, or view bad words (Admin only)",
  commandCategory: "Admin",
  usages: "[add/remove/show] [word]",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;

  if (senderID !== ownerID) {
    return api.sendMessage("এই কমান্ড শুধু বট এডমিন ব্যবহার করতে পারবে!", threadID, messageID);
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ badWords: [] }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(filePath));
  const badWords = data.badWords || [];

  const [action, ...rest] = args;
  const word = rest.join(" ").toLowerCase();

  if (!action) {
    return api.sendMessage("ব্যবহার:\n- badword add [word]\n- badword remove [word]\n- badword show", threadID, messageID);
  }

  if (action === "add") {
    if (!word) return api.sendMessage("যে শব্দটা add করতে চাও সেটা দাও!", threadID, messageID);
    if (badWords.includes(word)) return api.sendMessage(`"${word}" আগেই add করা আছে।`, threadID, messageID);
    badWords.push(word);
    fs.writeFileSync(filePath, JSON.stringify({ badWords }, null, 2));
    return api.sendMessage(`✅ "${word}" নিষিদ্ধ শব্দ হিসেবে add করা হলো।`, threadID, messageID);
  }

  if (action === "remove") {
    if (!word) return api.sendMessage("যে শব্দটা remove করতে চাও সেটা দাও!", threadID, messageID);
    if (!badWords.includes(word)) return api.sendMessage(`"${word}" নিষিদ্ধ তালিকায় নেই।`, threadID, messageID);
    const index = badWords.indexOf(word);
    badWords.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify({ badWords }, null, 2));
    return api.sendMessage(`❌ "${word}" নিষিদ্ধ তালিকা থেকে সরানো হলো।`, threadID, messageID);
  }

  if (action === "show") {
    const list = badWords.length > 0 ? badWords.join(", ") : "❌ কোনো নিষিদ্ধ শব্দ নেই।";
    return api.sendMessage(`🔒 নিষিদ্ধ শব্দ তালিকা:\n${list}`, threadID, messageID);
  }

  return api.sendMessage("সঠিকভাবে কমান্ড দাও:\n- badword add/remove/show", threadID, messageID);
};
