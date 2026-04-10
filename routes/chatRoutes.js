const express = require("express");
const router = express.Router();
const { getGeminiResponse } = require("../controllers/chatController");

router.post("/query", getGeminiResponse);

module.exports = router;