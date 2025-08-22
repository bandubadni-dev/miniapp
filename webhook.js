// Webhook server untuk production deployment
// Digunakan untuk menerima updates dari Telegram via webhook

require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bot = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'KBBI Crossword Bot is running',
    timestamp: new Date().toISOString(),
    miniAppUrl: process.env.MINI_APP_URL
  });
});

// Webhook endpoint untuk menerima updates dari Telegram
app.post(`/bot${token}`, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  
  if (WEBHOOK_URL) {
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}/bot${token}`);
  } else {
    console.log('⚠️  WEBHOOK_URL not set, using polling mode');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down webhook server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down webhook server...');
  process.exit(0);
});

module.exports = app;