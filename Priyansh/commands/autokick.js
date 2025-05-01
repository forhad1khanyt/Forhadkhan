const fs = require("fs");
const path = require("path");

const warningsFile = path.join(__dirname, "autokick_warnings.json");
const badWordsFile = path.join(__dirname, "autokick_badwords.json");

// Ensure warning file exists
if (!fs.existsSync(warningsFile)) fs.writeFileSync(warningsFile, "{}");

const ownerID = "100067984247525"; // তোমার UID

module.exports.config = {
  name: "autokick",
  version: "3.0.0",
  hasPermission: 2,
  credits: "Modified by ChatGPT",
  description: "Kick user after warning if bad word used",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, body } = event;
  if (!body) return;

  // ✅ বট অ্যাডমিন কিনা চেক করো
  const threadInfo = await api.getThreadInfo(threadID);
  const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
  if (!botIsAdmin) return;

  const message = body.toLowerCase();

  // Load bad words
  const badWordsData = JSON.parse(fs.readFileSync(badWordsFile, "utf-8"));
  const badWords = badWordsData.badWords || [];

  const isBad = badWords.some(word => message.includes(word));
  if (!isBad) return;

  // Owner বললে শুধু রিপ্লাই দিবে
  if (senderID === ownerID) {
    return api.sendMessage(
      "ছি উস্তাদ... অন্যের জন্যে নিষিদ্ধ শব্দ আপনি ব্যবহার করতেছেন,,,,\n😞😞😞",
      threadID,
      null,
      event.messageID
    );
  }

  // Warning লোড
  const warnings = JSON.parse(fs.readFileSync(warningsFile, "utf-8"));
  warnings[senderID] = (warnings[senderID] || 0) + 1;

  if (warnings[senderID] === 1) {
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));

    return api.sendMessage(
      {
        body: `⚠️ নিষিদ্ধ শব্দ ব্যবহার করেছেন! পরের বার কিক করা হবে!`,
        mentions: [{
          tag: "User",
          id: senderID
        }]
      },
      threadID,
      null,
      event.messageID
    );
  }

  // কিক করার অংশ
  try {
    await api.removeUserFromGroup(senderID, threadID);
    delete warnings[senderID];
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
  } catch (err) {
    console.log("❌ ইউজারকে কিক করতে ব্যর্থ:", err);
  }
};

module.exports.run = () => {};
