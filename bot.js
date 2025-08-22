// Telegram Bot Integration untuk KBBI Crossword Mini App
// Production-ready bot dengan environment variables dan error handling

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Configuration dari environment variables
const token = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://miniapp-six-lime.vercel.app/start.html';
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Validasi token
if (token === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ Error: BOT_TOKEN tidak ditemukan!');
  console.log('💡 Tip: Buat file .env dan tambahkan BOT_TOKEN=your_actual_token');
  process.exit(1);
}

// Setup bot dengan webhook atau polling
let bot;
if (WEBHOOK_URL) {
  // Production mode dengan webhook
  bot = new TelegramBot(token);
  bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);
  console.log('🌐 Bot running in webhook mode');
} else {
  // Development mode dengan polling
  bot = new TelegramBot(token, {polling: true});
  console.log('🔄 Bot running in polling mode');
}

console.log('🤖 KBBI Crossword Bot is starting...');
console.log('📱 Mini App URL:', MINI_APP_URL);

// Handler untuk command /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Pemain';
  
  const welcomeMessage = `Halo ${firstName}! 👋\n\nSelamat datang di KBBI Crossword Game! 🧩\n\nGame teka-teki silang berbahasa Indonesia yang menantang dengan berbagai tingkat kesulitan. Uji kemampuan kosakata Anda!\n\n🎮 Fitur Game:\n• 100+ level dengan tingkat kesulitan berbeda\n• Sistem achievement dan progress tracking\n• Haptic feedback untuk pengalaman bermain yang lebih baik\n• Sinkronisasi progress dengan Telegram Cloud Storage\n\nKlik tombol di bawah untuk mulai bermain!`;
  
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🎮 Start Game", web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
});

// Handler untuk command /play (alternatif untuk memulai game)
bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, "Mainkan game!", {
    reply_markup: {
      inline_keyboard: [[
        { text: "Start Game", web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
});

// Handler untuk command /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `📖 Bantuan KBBI Crossword Game\n\n🎯 Cara Bermain:\n• Pilih level sesuai kemampuan Anda\n• Isi kotak-kotak kosong dengan huruf yang tepat\n• Gunakan petunjuk (clues) untuk membantu\n• Selesaikan semua kata untuk menyelesaikan level\n\n⌨️ Commands:\n/start - Mulai game\n/play - Buka game\n/help - Tampilkan bantuan ini\n/stats - Lihat statistik Anda\n\n🏆 Fitur:\n• Progress otomatis tersimpan\n• Achievement system\n• Berbagai tingkat kesulitan\n• Haptic feedback\n\nSelamat bermain! 🎮`;
  
  bot.sendMessage(chatId, helpMessage);
});

// Handler untuk command /stats
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  
  // Dalam implementasi nyata, Anda bisa mengambil data dari database
  const statsMessage = `📊 Statistik Anda\n\n🎮 Total Game Dimainkan: -\n🏆 Level Diselesaikan: -\n⭐ Achievement Terbuka: -\n🔥 Streak Terpanjang: -\n\nMulai bermain untuk melihat statistik Anda!`;
  
  bot.sendMessage(chatId, statsMessage, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🎮 Mulai Bermain", web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
});

// Handler untuk menerima data dari Mini App
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app_data.data);
  
  console.log('Data dari Mini App:', data);
  
  // Handle berbagai jenis data dari Mini App
  switch(data.type) {
    case 'game_completed':
      handleGameCompletion(chatId, data);
      break;
    case 'achievement_unlocked':
      handleAchievement(chatId, data);
      break;
    case 'help_request':
      handleHelpRequest(chatId, data);
      break;
    case 'share_score':
      handleScoreShare(chatId, data);
      break;
    default:
      console.log('Tipe data tidak dikenal:', data.type);
  }
});

// Function untuk handle penyelesaian game
function handleGameCompletion(chatId, data) {
  const { level, score, time, accuracy } = data;
  
  const completionMessage = `🎉 Selamat! Level ${level} selesai!\n\n📊 Hasil Anda:\n⭐ Skor: ${score}\n⏱️ Waktu: ${time}\n🎯 Akurasi: ${accuracy}%\n\nLanjutkan ke level berikutnya?`;
  
  bot.sendMessage(chatId, completionMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 Lanjut Bermain", web_app: { url: MINI_APP_URL } }],
        [{ text: "📤 Share Skor", callback_data: `share_${level}_${score}` }]
      ]
    }
  });
}

// Function untuk handle achievement
function handleAchievement(chatId, data) {
  const { achievement, description } = data;
  
  const achievementMessage = `🏆 Achievement Terbuka!\n\n${achievement}\n${description}\n\nTerus bermain untuk membuka achievement lainnya!`;
  
  bot.sendMessage(chatId, achievementMessage);
}

// Function untuk handle permintaan bantuan
function handleHelpRequest(chatId, data) {
  const { level, difficulty } = data;
  
  const helpMessage = `💡 Bantuan untuk Level ${level}\n\nTingkat Kesulitan: ${difficulty}\n\nTips:\n• Mulai dari kata-kata pendek\n• Perhatikan huruf yang bersilangan\n• Gunakan petunjuk dengan bijak\n• Jangan ragu untuk menggunakan hint\n\nSemangat! 💪`;
  
  bot.sendMessage(chatId, helpMessage, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🎮 Kembali ke Game", web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
}

// Function untuk handle share skor
function handleScoreShare(chatId, data) {
  const { level, score, time } = data;
  
  const shareMessage = `🎮 KBBI Crossword Game\n\n🏆 Saya baru saja menyelesaikan Level ${level}!\n⭐ Skor: ${score}\n⏱️ Waktu: ${time}\n\nIkut bermain juga yuk! 👇`;
  
  bot.sendMessage(chatId, shareMessage, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🎮 Mainkan KBBI Crossword", web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
}

// Handler untuk callback query (tombol inline)
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  
  if (data.startsWith('share_')) {
    const [, level, score] = data.split('_');
    handleScoreShare(message.chat.id, { level, score, time: 'N/A' });
  }
  
  // Answer callback query untuk menghilangkan loading
  bot.answerCallbackQuery(callbackQuery.id);
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Polling error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 KBBI Crossword Bot is running...');
console.log('📱 Mini App URL:', MINI_APP_URL);

// Export bot untuk testing atau penggunaan lain
module.exports = bot;