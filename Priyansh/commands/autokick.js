const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "autokick_badwords.json");  // এখানে নাম পরিবর্তন করেছি
const warningFilePath = path.join(__dirname, "autokick_warnings.json");

module.exports.config = {
  name: "autokick",
  version: "1.0.0",
  hasPermission: 2,
  credits: "Modified by ChatGPT",
  description: "Auto kick user when bad words are used",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5,
};

const badWords = JSON.parse(fs.readFileSync(filePath)).badWords || [];
let warnings = fs.existsSync(warningFilePath) ? JSON.parse(fs.readFileSync(warningFilePath)) : {};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, body } = event;

  if (!body) return;
  const message = body.toLowerCase();

  // চেক করো মেসেজে নিষিদ্ধ কোনো শব্দ আছে কিনা
  if (badWords.some(word => message.includes(word))) {
    if (!warnings[senderID]) warnings[senderID] = 0;
    
    // প্রথমবার warning
    if (warnings[senderID] === 0) {
      warnings[senderID] = 1;
      fs.writeFileSync(warningFilePath, JSON.stringify(warnings, null, 2));
      return api.sendMessage(`🚨 Warning! ${event.senderName} আপনি নিষিদ্ধ শব্দ ব্যবহার করেছেন। আবার করলে কিক করা হবে।`, threadID);
    }
    
    // দ্বিতীয়বার কিক
    if (warnings[senderID] === 1) {
      try {
        await api.removeUserFromGroup(senderID, threadID);
        warnings[senderID] = 0;
        fs.writeFileSync(warningFilePath, JSON.stringify(warnings, null, 2));
        return api.sendMessage(`${event.senderName} কে গ্রুপ থেকে কিক করা হয়েছে।`, threadID);
      } catch (err) {
        console.log("Couldn't remove user. Maybe not admin or target is admin.");
      }
    }
  }
};

module.exports.run = () => {};
