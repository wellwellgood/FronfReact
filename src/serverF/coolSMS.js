const express = require('express');
const router = express.Router();
const Coolsms = require('coolsms-node-sdk').default;
require("dotenv").config();

const apiKey = process.env.COOLSMS_API_KEY;
const apiSecret = process.env.COOLSMS_API_SECRET;
const from = process.env.COOLSMS_SENDER_NUMBER;

const messageService = new Coolsms(apiKey, apiSecret);


function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6자리 인증번호
}

router.post('/send-code', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !/^01[0-9]-\d{3,4}-\d{4}$/.test(phoneNumber)) {
    return res.status(400).json({ message: "휴대폰 번호 형식이 올바르지 않습니다." });
  }

  const purePhone = phoneNumber.replace(/-/g, '');
  const code = generateCode();

  try {
    console.log("✅ 보내는 번호:", purePhone);
    console.log("✅ 인증코드:", code);

    const result = await messageService.sendOne({
      to: purePhone,
      from,
      text: `[인증번호] ${code} (본인확인용)`
    });

    console.log("✅ 쿨SMS 응답:", result);
    res.json({ success: true, code }); // 실서비스에서는 code 제외할 것
  } catch (error) {
    console.error("문자 전송 실패:", error);
    res.status(500).json({ message: "문자 전송에 실패했습니다." });
  }
});

module.exports = router;