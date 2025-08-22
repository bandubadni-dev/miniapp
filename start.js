// Start Page JavaScript - Checkpoint System (1-100 Levels)

class StartPage {
    constructor() {
        this.maxLevel = 100;
        this.currentLevel = 1;
        this.unlockedLevel = 1;
        this.progress = {};
        this.tg = window.Telegram.WebApp;
        this.user = this.tg.initDataUnsafe?.user;
        
        this.initializeTelegram();
        this.loadProgress();
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeTelegram() {
        // Set up Telegram Web App
        this.tg.ready();
        this.tg.expand();
        
        // Apply Telegram theme
        document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#6366f1');
        document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#6366f1');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
        
        // Set up main button
        this.tg.MainButton.setText('Mulai Bermain');
        this.tg.MainButton.onClick(() => {
            this.selectLevel(this.currentLevel);
        });
        this.tg.MainButton.show();
        
        // Initialize achievements system
        this.initializeAchievements();
    }

    async loadProgress() {
        try {
            // Use Telegram Cloud Storage instead of localStorage
            const savedProgress = await this.getCloudStorageItem('crosswordProgress');
            if (savedProgress) {
                this.progress = JSON.parse(savedProgress);
                this.currentLevel = this.progress.currentLevel || 1;
                this.unlockedLevel = this.currentLevel;
            }
        } catch (error) {
            console.log('Failed to load progress from cloud storage:', error);
            // Fallback to localStorage for development
            const savedProgress = localStorage.getItem('crosswordProgress');
            if (savedProgress) {
                this.progress = JSON.parse(savedProgress);
                this.currentLevel = this.progress.currentLevel || 1;
                this.unlockedLevel = this.currentLevel;
            }
        }
    }

    async getCloudStorageItem(key) {
        // Check if CloudStorage is available and supported
        if (this.tg.CloudStorage && 
            typeof this.tg.CloudStorage.getItem === 'function' && 
            this.tg.version >= '6.1') {
            try {
                return new Promise((resolve, reject) => {
                    this.tg.CloudStorage.getItem(key, (error, value) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(value);
                        }
                    });
                });
            } catch (error) {
                // If CloudStorage fails, fallback to localStorage
                const value = localStorage.getItem(key);
                return Promise.resolve(value);
            }
        } else {
            // Fallback to localStorage
            const value = localStorage.getItem(key);
            return Promise.resolve(value);
        }
    }

    async setCloudStorageItem(key, value) {
        // Check if CloudStorage is available and supported
        if (this.tg.CloudStorage && 
            typeof this.tg.CloudStorage.setItem === 'function' && 
            this.tg.version >= '6.1') {
            try {
                return new Promise((resolve, reject) => {
                    this.tg.CloudStorage.setItem(key, value, (error, success) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(success);
                        }
                    });
                });
            } catch (error) {
                // If CloudStorage fails, fallback to localStorage
                localStorage.setItem(key, value);
                return Promise.resolve();
            }
        } else {
            // Fallback to localStorage
            localStorage.setItem(key, value);
            return Promise.resolve();
        }
    }

    initializeUI() {
        this.createLevelGrid();
        this.updatePlayerStats();
        this.updateDailyChallenge();
    }

    createLevelGrid() {
        const mainMenu = document.querySelector('#main-menu');
        if (!mainMenu) return;

        // Clear existing content except the header
        const header = mainMenu.querySelector('.text-center');
        mainMenu.innerHTML = '';
        if (header) {
            mainMenu.appendChild(header);
        }

        // Create level selection container
        const levelContainer = document.createElement('div');
        levelContainer.className = 'mt-8';
        levelContainer.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-800">Pilih Level</h2>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Progress:</span>
                    <span class="text-sm font-bold text-primary">${this.unlockedLevel}/${this.maxLevel}</span>
                </div>
            </div>
            
            <!-- Level Grid -->
            <div id="level-grid" class="grid grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
                <!-- Levels will be generated here -->
            </div>
            
            <!-- Quick Actions -->
            <div class="mt-6 space-y-3">
                <button id="continue-btn" class="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2">
                    <i class="fas fa-play"></i>
                    Lanjutkan Level ${this.currentLevel}
                </button>
                <button id="daily-challenge-btn" class="w-full bg-accent text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2">
                    <i class="fas fa-calendar-day"></i>
                    Tantangan Harian
                </button>
            </div>
        `;

        mainMenu.appendChild(levelContainer);
        this.generateLevelButtons();
    }

    generateLevelButtons() {
        const levelGrid = document.querySelector('#level-grid');
        if (!levelGrid) return;

        levelGrid.innerHTML = '';

        for (let level = 1; level <= this.maxLevel; level++) {
            const levelButton = document.createElement('button');
            const isUnlocked = level <= this.unlockedLevel;
            const isCompleted = this.progress.levels && this.progress.levels[level] && this.progress.levels[level].completed;
            const isCurrent = level === this.currentLevel;

            levelButton.className = `level-btn aspect-square rounded-xl font-bold text-sm transition-all duration-200 ${this.getLevelButtonClass(level, isUnlocked, isCompleted, isCurrent)}`;
            levelButton.textContent = level;
            levelButton.dataset.level = level;

            if (isUnlocked) {
                levelButton.addEventListener('click', () => this.selectLevel(level));
            }

            // Add completion indicator
            if (isCompleted) {
                const checkIcon = document.createElement('i');
                checkIcon.className = 'fas fa-check absolute top-1 right-1 text-xs';
                levelButton.style.position = 'relative';
                levelButton.appendChild(checkIcon);
            }

            // Add current level indicator
            if (isCurrent && !isCompleted) {
                levelButton.style.boxShadow = '0 0 0 2px #3B82F6';
            }

            levelGrid.appendChild(levelButton);
        }
    }

    getLevelButtonClass(level, isUnlocked, isCompleted, isCurrent) {
        if (!isUnlocked) {
            return 'bg-gray-200 text-gray-400 cursor-not-allowed';
        }
        
        if (isCompleted) {
            return 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200';
        }
        
        if (isCurrent) {
            return 'bg-blue-100 text-blue-800 border-2 border-blue-300 hover:bg-blue-200';
        }
        
        return 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200';
    }

    async selectLevel(level) {
        if (level > this.unlockedLevel) {
            this.showMessage('Level ini belum terbuka!');
            this.tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        // Update current level
        this.currentLevel = level;
        try {
            await this.setCloudStorageItem('currentLevel', level.toString());
        } catch (error) {
            localStorage.setItem('currentLevel', level.toString());
        }
        
        // Haptic feedback
        this.tg.HapticFeedback.impactOccurred('light');
        
        // Navigate to game
        window.location.href = `play.html?level=${level}`;
    }

    setupEventListeners() {
        // Continue button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'continue-btn') {
                this.selectLevel(this.currentLevel);
            }
        });

        // Daily challenge button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'daily-challenge-btn') {
                this.startDailyChallenge();
            }
        });

        // Settings button
        const settingsBtn = document.querySelector('header button:first-child');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Achievements button
        const achievementsBtn = document.querySelector('header button:last-child');
        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.showAchievements());
        }

        // Level filter buttons
        this.createLevelFilters();
    }

    createLevelFilters() {
        const levelContainer = document.querySelector('#main-menu > div:last-child');
        if (!levelContainer) return;

        const filterContainer = document.createElement('div');
        filterContainer.className = 'flex gap-2 mb-4 overflow-x-auto';
        filterContainer.innerHTML = `
            <button class="filter-btn active px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap" data-filter="all">
                Semua
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap" data-filter="unlocked">
                Terbuka
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap" data-filter="completed">
                Selesai
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap" data-filter="incomplete">
                Belum Selesai
            </button>
        `;

        // Insert before level grid
        const levelGrid = document.querySelector('#level-grid');
        levelGrid.parentNode.insertBefore(filterContainer, levelGrid);

        // Add filter event listeners
        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.applyFilter(e.target.dataset.filter);
                
                // Update active state
                filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    }

    applyFilter(filter) {
        const levelButtons = document.querySelectorAll('.level-btn');
        
        levelButtons.forEach(btn => {
            const level = parseInt(btn.dataset.level);
            const isUnlocked = level <= this.unlockedLevel;
            const isCompleted = this.progress.levels && this.progress.levels[level] && this.progress.levels[level].completed;
            
            let show = true;
            
            switch (filter) {
                case 'unlocked':
                    show = isUnlocked;
                    break;
                case 'completed':
                    show = isCompleted;
                    break;
                case 'incomplete':
                    show = isUnlocked && !isCompleted;
                    break;
                case 'all':
                default:
                    show = true;
                    break;
            }
            
            btn.style.display = show ? 'flex' : 'none';
        });
    }

    updatePlayerStats() {
        // Create or update stats section
        let statsSection = document.querySelector('#player-stats');
        if (!statsSection) {
            statsSection = document.createElement('div');
            statsSection.id = 'player-stats';
            statsSection.className = 'mt-8 p-4 bg-gray-50 rounded-xl';
            
            const mainMenu = document.querySelector('#main-menu');
            if (mainMenu) {
                mainMenu.appendChild(statsSection);
            }
        }

        const completedLevels = this.getCompletedLevelsCount();
        const totalScore = this.getTotalScore();
        const bestTime = this.getBestTime();
        const currentStreak = this.getCurrentStreak();

        statsSection.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-4">Statistik Pemain</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-primary">${completedLevels}</div>
                    <div class="text-sm text-gray-600">Level Selesai</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-accent">${totalScore.toLocaleString()}</div>
                    <div class="text-sm text-gray-600">Total Poin</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-secondary">${bestTime}</div>
                    <div class="text-sm text-gray-600">Waktu Terbaik</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-primary">${currentStreak}</div>
                    <div class="text-sm text-gray-600">Hari Berturut</div>
                </div>
            </div>
        `;
    }

    getCompletedLevelsCount() {
        if (!this.progress.levels) return 0;
        return Object.values(this.progress.levels).filter(level => level.completed).length;
    }

    getTotalScore() {
        if (!this.progress.levels) return 0;
        return Object.values(this.progress.levels)
            .filter(level => level.completed)
            .reduce((total, level) => total + (level.bestScore || 0), 0);
    }

    getBestTime() {
        if (!this.progress.levels) return '--:--';
        const times = Object.values(this.progress.levels)
            .filter(level => level.completed && level.bestTime)
            .map(level => level.bestTime);
        
        if (times.length === 0) return '--:--';
        
        const bestTime = Math.min(...times);
        const minutes = Math.floor(bestTime / 60);
        const seconds = bestTime % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getCurrentStreak() {
        // Simple streak calculation - can be enhanced
        return this.progress.currentStreak || 0;
    }

    async updateDailyChallenge() {
        // Check if daily challenge is available
        const today = new Date().toDateString();
        let lastDaily;
        
        try {
            lastDaily = await this.getCloudStorageItem('lastDailyChallenge');
        } catch (error) {
            lastDaily = localStorage.getItem('lastDailyChallenge');
        }
        
        const isDailyAvailable = lastDaily !== today;

        const dailyBtn = document.querySelector('#daily-challenge-btn');
        if (dailyBtn) {
            if (isDailyAvailable) {
                dailyBtn.classList.remove('opacity-50');
                dailyBtn.disabled = false;
                dailyBtn.innerHTML = `
                    <i class="fas fa-calendar-day"></i>
                    Tantangan Harian (+500 Poin)
                `;
            } else {
                dailyBtn.classList.add('opacity-50');
                dailyBtn.disabled = true;
                dailyBtn.innerHTML = `
                    <i class="fas fa-check"></i>
                    Tantangan Selesai Hari Ini
                `;
            }
        }
    }

    async startDailyChallenge() {
        const today = new Date().toDateString();
        let lastDaily;
        
        try {
            lastDaily = await this.getCloudStorageItem('lastDailyChallenge');
        } catch (error) {
            lastDaily = localStorage.getItem('lastDailyChallenge');
        }
        
        if (lastDaily === today) {
            this.showMessage('Tantangan harian sudah diselesaikan hari ini!');
            this.tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        // Generate random level for daily challenge
        const randomLevel = Math.floor(Math.random() * Math.min(this.unlockedLevel, 20)) + 1;
        
        // Mark daily challenge as started
        try {
            await this.setCloudStorageItem('isDailyChallenge', 'true');
            await this.setCloudStorageItem('dailyChallengeLevel', randomLevel.toString());
        } catch (error) {
            localStorage.setItem('isDailyChallenge', 'true');
            localStorage.setItem('dailyChallengeLevel', randomLevel.toString());
        }
        
        // Haptic feedback
        this.tg.HapticFeedback.impactOccurred('medium');
        
        window.location.href = `play.html?level=${randomLevel}&daily=true`;
    }

    showSettings() {
        const modal = this.createModal('Pengaturan', `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-gray-700">Suara</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" id="sound-toggle" checked>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-700">Notifikasi</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" id="notification-toggle" checked>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div class="pt-4 border-t">
                    <button id="reset-progress-btn" class="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-medium">
                        Reset Progress
                    </button>
                </div>
            </div>
        `);

        // Add event listeners
        modal.querySelector('#reset-progress-btn').addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin mereset semua progress? Tindakan ini tidak dapat dibatalkan.')) {
                this.resetProgress();
                modal.remove();
            }
        });
    }

    showAchievements() {
        const achievements = this.getAchievements();
        
        const achievementsList = achievements.map(achievement => `
            <div class="flex items-center gap-3 p-3 rounded-lg ${achievement.unlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-medium ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}">${achievement.title}</h4>
                    <p class="text-sm ${achievement.unlocked ? 'text-green-600' : 'text-gray-500'}">${achievement.description}</p>
                </div>
                ${achievement.unlocked ? '<i class="fas fa-check text-green-600"></i>' : ''}
            </div>
        `).join('');

        this.createModal('Pencapaian', `
            <div class="space-y-3 max-h-96 overflow-y-auto">
                ${achievementsList}
            </div>
        `);
    }

    getAchievements() {
        const completedLevels = this.getCompletedLevelsCount();
        
        return [
            {
                title: 'Pemula',
                description: 'Selesaikan level pertama',
                icon: 'fas fa-play',
                unlocked: completedLevels >= 1
            },
            {
                title: 'Penjelajah',
                description: 'Selesaikan 10 level',
                icon: 'fas fa-map',
                unlocked: completedLevels >= 10
            },
            {
                title: 'Ahli',
                description: 'Selesaikan 25 level',
                icon: 'fas fa-star',
                unlocked: completedLevels >= 25
            },
            {
                title: 'Master',
                description: 'Selesaikan 50 level',
                icon: 'fas fa-crown',
                unlocked: completedLevels >= 50
            },
            {
                title: 'Legenda',
                description: 'Selesaikan semua 100 level',
                icon: 'fas fa-trophy',
                unlocked: completedLevels >= 100
            }
        ];
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button class="close-modal text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal events
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    async resetProgress() {
        try {
            // Clear Telegram Cloud Storage
            await this.setCloudStorageItem('crosswordProgress', '');
            await this.setCloudStorageItem('currentLevel', '');
            await this.setCloudStorageItem('lastDailyChallenge', '');
            await this.setCloudStorageItem('isDailyChallenge', '');
            await this.setCloudStorageItem('dailyChallengeLevel', '');
        } catch (error) {
            // Fallback to localStorage
            localStorage.removeItem('crosswordProgress');
            localStorage.removeItem('currentLevel');
            localStorage.removeItem('lastDailyChallenge');
            localStorage.removeItem('isDailyChallenge');
            localStorage.removeItem('dailyChallengeLevel');
        }
        
        // Reset local state
        this.currentLevel = 1;
        this.unlockedLevel = 1;
        this.progress = {};
        
        // Haptic feedback
        this.tg.HapticFeedback.notificationOccurred('success');
        
        // Refresh UI
        this.initializeUI();
        this.showMessage('Progress berhasil direset!');
    }

    showMessage(message, type = 'info') {
        // Use Telegram's native alert for better integration
        if (type === 'error') {
            this.tg.showAlert(message);
        } else {
            this.tg.showPopup({
                title: type === 'success' ? 'Berhasil!' : 'Info',
                message: message,
                buttons: [{ type: 'ok' }]
            });
        }
    }
}

// Initialize start page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#main-menu')) {
        new StartPage();
    }

    // Add CSS for filter buttons
    const style = document.createElement('style');
    style.textContent = `
        .filter-btn {
            background-color: #f3f4f6;
            color: #6b7280;
            transition: all 0.2s;
        }
        .filter-btn:hover {
            background-color: #e5e7eb;
        }
        .filter-btn.active {
            background-color: #3b82f6;
            color: white;
        }
    `;
    document.head.appendChild(style);
});

// Add achievement and sharing methods to StartPage prototype
StartPage.prototype.initializeAchievements = async function() {
    try {
        const achievements = await this.getCloudStorageItem('achievements');
        this.achievements = achievements ? JSON.parse(achievements) : {
            firstGame: false,
            speedRunner: false,
            perfectionist: false,
            dailyStreak: 0,
            totalLevels: 0,
            totalScore: 0
        };
    } catch (error) {
        this.achievements = {
            firstGame: false,
            speedRunner: false,
            perfectionist: false,
            dailyStreak: 0,
            totalLevels: 0,
            totalScore: 0
        };
    }
};

StartPage.prototype.updateAchievements = async function(levelCompleted, score, time, mistakes = 0) {
    let newAchievements = [];
    
    // First game achievement
    if (!this.achievements.firstGame) {
        this.achievements.firstGame = true;
        newAchievements.push('🎉 Selamat! Anda telah menyelesaikan level pertama!');
    }
    
    // Speed runner achievement (complete level in under 60 seconds)
    if (time < 60 && !this.achievements.speedRunner) {
        this.achievements.speedRunner = true;
        newAchievements.push('⚡ Speed Runner! Menyelesaikan level dalam waktu kurang dari 1 menit!');
    }
    
    // Perfectionist achievement (complete level without mistakes)
    if (mistakes === 0 && !this.achievements.perfectionist) {
        this.achievements.perfectionist = true;
        newAchievements.push('💎 Perfectionist! Menyelesaikan level tanpa kesalahan!');
    }
    
    // Update totals
    this.achievements.totalLevels++;
    this.achievements.totalScore += score;
    
    // Save achievements
    try {
        await this.setCloudStorageItem('achievements', JSON.stringify(this.achievements));
    } catch (error) {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }
    
    // Show new achievements
    for (const achievement of newAchievements) {
        this.tg.showPopup({
            title: 'Achievement Unlocked!',
            message: achievement,
            buttons: [{ type: 'ok' }]
        });
        this.tg.HapticFeedback.notificationOccurred('success');
    }
};

StartPage.prototype.shareToTelegram = async function(message, url = null) {
    const shareUrl = url || window.location.href;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`;
    this.tg.openTelegramLink(telegramShareUrl);
};

StartPage.prototype.sendDataToBot = async function(data) {
    // Send data to the bot using Telegram Web App API
    this.tg.sendData(JSON.stringify(data));
};

StartPage.prototype.inviteFriends = async function() {
    const inviteMessage = `🧩 Ayo main Teka-Teki Silang KBBI bersama! Game puzzle bahasa Indonesia yang seru dan mendidik. Klik link ini untuk bermain:`;
    await this.shareToTelegram(inviteMessage);
};