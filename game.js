// Crossword Game JavaScript - Checkpoint System (1-100 Levels)

class CrosswordGame {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.gameData = null;
        this.grid = [];
        this.selectedCell = null;
        this.selectedDirection = 'across';
        this.startTime = null;
        this.timer = null;
        this.hintsUsed = 0;
        this.score = 0;
        this.completedWords = new Set();
        this.isGameActive = false;
        
        // Initialize Telegram Web App
        this.tg = window.Telegram.WebApp;
        this.tg.ready();
        this.tg.expand();
        
        // Apply Telegram theme
        this.applyTelegramTheme();
        
        // Setup Telegram Main Button
        this.setupMainButton();
        
        this.initializeGame();
    }

    initializeGame() {
        this.gameData = this.generateLevelData(this.currentLevel);
        this.createGrid();
        this.displayClues();
        this.setupEventListeners();
        this.updateUI();
        this.startTimer();
        this.isGameActive = true;
        
        // Show Telegram back button
        this.tg.BackButton.show();
        this.tg.BackButton.onClick(() => {
            this.handleBackToMenu();
        });
    }

    // Generate level data based on checkpoint number
    generateLevelData(level) {
        // Unique word sets for each level 1-10
        const levelData = {
            1: {
                words: [
                    { word: 'TROPIS', clue: 'Iklim di Indonesia', startRow: 0, startCol: 0, direction: 'down' },
                    { word: 'PIKET', clue: 'Kerja sama disekolah', startRow: 0, startCol: 4, direction: 'down' },
                    { word: 'PENYEBUT', clue: 'Sebutan untuk 5 pada pecahan 2/5', startRow: 3, startCol: 0, direction: 'across' },
                    { word: 'TIGA', clue: 'Persatuan indonesia silah ke...', startRow: 3, startCol: 7, direction: 'down' },
                    { word: 'CUACA', clue: 'Hujan, Pansan, Badai', startRow: 5, startCol: 6, direction: 'across' },
                ]
            },
            2: {
                words: [
                    { word: 'BALON', clue: 'Selalu ada di ulang tahun', startRow: 0, startCol: 2, direction: 'down' },
                    { word: 'API', clue: 'Panas', startRow: 4, startCol: 4, direction: 'down' },
                    { word: 'MOBIL', clue: 'Transportasi roda 4', startRow: 0, startCol: 0, direction: 'across' },
                    { word: 'BOLA', clue: 'Benda bulat', startRow: 4, startCol: 1, direction: 'across' },
                    { word: 'PINTO', clue: 'Alat keluar masuk', startRow: 5, startCol: 4, direction: 'across' }
                ]
            },
            3: {
                words: [
                    { word: 'MASINIS', clue: 'Orang yang menjalankan kereta api', startRow: 0, startCol: 5, direction: 'down' },
                    { word: 'SURAMADU', clue: 'Jembatan yang menghubungkan Pulau Jawa dan Madura', startRow: 3, startCol: 3, direction: 'down' },
                    { word: 'SOEKARNO', clue: 'Presiden pertama Negara Indonesia', startRow: 4, startCol: 7, direction: 'down' },
                    { word: 'JAKARTA', clue: 'Ibu kota Negara Indonesia', startRow: 4, startCol: 10, direction: 'down' },
                    { word: 'HERBIVORA', clue: 'Hewan pemakan tumbuhan', startRow: 5, startCol: 1, direction: 'across' },
                    { word: 'SURABAYA', clue: 'Ibu kota provinsi Jawa Timur', startRow: 8, startCol: 0, direction: 'across' },
                    { word: 'RANTAI', clue: 'Lambang Pancasila sila kedua', startRow: 8, startCol: 9, direction: 'across' },
                    { word: 'INSANG', clue: 'Alat pernapasan pada ikan', startRow: 10, startCol: 6, direction: 'across' },
                ]
            },
        };

        // Get word set for current level (1-10)
        const currentLevel = Math.min(Math.max(level, 1), 10);
        const selectedWordSet = levelData[currentLevel] || levelData[1]; // Fallback to level 1 if level not found

        // Calculate grid size automatically based on word positions
        let maxRow = 0;
        let maxCol = 0;
        
        selectedWordSet.words.forEach(word => {
            const wordLength = word.word.length;
            if (word.direction === 'across') {
                maxRow = Math.max(maxRow, word.startRow + 1);
                maxCol = Math.max(maxCol, word.startCol + wordLength);
            } else { // direction === 'down'
                maxRow = Math.max(maxRow, word.startRow + wordLength);
                maxCol = Math.max(maxCol, word.startCol + 1);
            }
        });
        
        const gridSize = Math.max(maxRow, maxCol);
        const adjustedWords = selectedWordSet.words;

        return {
            level: level,
            gridSize: gridSize,
            title: `Level ${level}`,
            description: `Checkpoint ${level} - Grid ${gridSize}x${gridSize}`,
            words: adjustedWords,
            timeLimit: Math.min(300 + (level * 30), 900), // Cap time limit at 15 minutes
            minScore: level * 100 // Minimum score needed to advance
        };
    }

    createGrid() {
        const gridContainer = document.getElementById('crossword-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${this.gameData.gridSize}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${this.gameData.gridSize}, 1fr)`;
        
        // Set CSS variable for responsive grid sizing
        document.documentElement.style.setProperty('--grid-size', this.gameData.gridSize);

        // Initialize grid array
        this.grid = Array(this.gameData.gridSize).fill(null).map(() => 
            Array(this.gameData.gridSize).fill(null)
        );

        // Place words in grid
        let wordNumber = 1;
        this.gameData.words.forEach((wordData, index) => {
            const { word, startRow, startCol, direction } = wordData;
            
            // Check if this position already has a number
            if (!this.grid[startRow][startCol] || !this.grid[startRow][startCol].number) {
                // Assign word number
                if (!this.grid[startRow][startCol]) {
                    this.grid[startRow][startCol] = {};
                }
                this.grid[startRow][startCol].number = wordNumber;
                wordNumber++;
            }

            for (let i = 0; i < word.length; i++) {
                const row = direction === 'down' ? startRow + i : startRow;
                const col = direction === 'across' ? startCol + i : startCol;
                
                if (!this.grid[row][col]) {
                    this.grid[row][col] = {};
                }
                this.grid[row][col].letter = word[i];
                this.grid[row][col].isActive = true;
            }
        });

        // Create DOM elements
        for (let row = 0; row < this.gameData.gridSize; row++) {
            for (let col = 0; col < this.gameData.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.grid[row][col] && this.grid[row][col].isActive) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.className = 'cell-input';
                    
                    if (this.grid[row][col].number) {
                        const number = document.createElement('span');
                        number.className = 'cell-number';
                        number.textContent = this.grid[row][col].number;
                        cell.appendChild(number);
                    }
                    
                    cell.appendChild(input);
                    cell.classList.add('active-cell');
                } else {
                    cell.classList.add('blocked-cell');
                }

                gridContainer.appendChild(cell);
            }
        }
    }

    displayClues() {
        const acrossClues = document.getElementById('across-clues');
        const downClues = document.getElementById('down-clues');
        
        if (!acrossClues || !downClues) return;

        acrossClues.innerHTML = '';
        downClues.innerHTML = '';

        this.gameData.words.forEach(wordData => {
            const { clue, startRow, startCol, direction } = wordData;
            const wordNumber = this.grid[startRow][startCol].number;
            
            const clueElement = document.createElement('div');
            clueElement.className = 'clue-item';
            clueElement.innerHTML = `<span class="clue-number">${wordNumber}.</span> ${clue}`;
            
            if (direction === 'across') {
                acrossClues.appendChild(clueElement);
            } else {
                downClues.appendChild(clueElement);
            }
        });
    }

    setupEventListeners() {
        const gridContainer = document.getElementById('crossword-grid');
        if (!gridContainer) return;

        gridContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell-input')) {
                this.selectCell(e.target.parentElement);
            }
        });

        gridContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('cell-input')) {
                this.handleInput(e);
            }
        });

        gridContainer.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('cell-input')) {
                this.handleKeydown(e);
            }
        });
    }

    selectCell(cell) {
        // Remove previous selection
        document.querySelectorAll('.selected-cell').forEach(c => {
            c.classList.remove('selected-cell');
        });
        
        // Add selection to current cell
        cell.classList.add('selected-cell');
        this.selectedCell = cell;
        
        // Focus the input
        const input = cell.querySelector('.cell-input');
        if (input) {
            input.focus();
        }
    }

    handleInput(e) {
        const input = e.target;
        const value = input.value.toUpperCase();
        input.value = value;
        
        // Light haptic feedback for input
        this.tg.HapticFeedback.impactOccurred('light');
        
        if (value && this.selectedCell) {
            this.moveToNextCell();
        }
        
        this.checkCompletion();
    }

    handleKeydown(e) {
        if (e.key === 'Backspace' && !e.target.value) {
            this.moveToPreviousCell();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || 
                   e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.handleArrowKeys(e.key);
        }
    }

    moveToNextCell() {
        // Implementation for moving to next cell
    }

    moveToPreviousCell() {
        // Implementation for moving to previous cell
    }

    handleArrowKeys(key) {
        // Implementation for arrow key navigation
    }

    checkCompletion() {
        // Check if puzzle is completed
        let allCorrect = true;
        
        this.gameData.words.forEach(wordData => {
            const { word, startRow, startCol, direction } = wordData;
            let currentWord = '';
            
            for (let i = 0; i < word.length; i++) {
                const row = direction === 'down' ? startRow + i : startRow;
                const col = direction === 'across' ? startCol + i : startCol;
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const input = cell?.querySelector('.cell-input');
                currentWord += input?.value || '';
            }
            
            if (currentWord === word) {
                // Haptic feedback for correct word
                this.tg.HapticFeedback.notificationOccurred('success');
            } else {
                allCorrect = false;
            }
        });
        
        if (allCorrect) {
            this.completeGame();
        }
    }

    completeGame() {
        this.isGameActive = false;
        clearInterval(this.timer);
        
        // Calculate score
        const timeBonus = Math.max(0, this.gameData.timeLimit - this.getElapsedTime());
        this.score = (this.currentLevel * 100) + timeBonus - (this.hintsUsed * 10);
        
        // Strong haptic feedback for game completion
        this.tg.HapticFeedback.notificationOccurred('success');
        
        // Update Main Button for completion
        this.tg.MainButton.setText('Next Level');
        this.tg.MainButton.onClick(() => {
            if (this.currentLevel < this.maxLevel) {
                this.currentLevel++;
                this.initializeGame();
            } else {
                this.handleBackToMenu();
            }
        });
        
        // Show completion message using Telegram popup
        this.tg.showPopup({
            title: 'Congratulations!',
            message: `Level ${this.currentLevel} completed!\nScore: ${this.score}`,
            buttons: [{
                id: 'share',
                type: 'default',
                text: 'Share Score'
            }, {
                id: 'next',
                type: 'default',
                text: this.currentLevel < this.maxLevel ? 'Next Level' : 'Back to Menu'
            }]
        }, (buttonId) => {
            if (buttonId === 'share') {
                this.shareScore();
            } else {
                if (this.currentLevel < this.maxLevel) {
                    this.currentLevel++;
                    this.initializeGame();
                } else {
                    this.handleBackToMenu();
                }
            }
        });
    }

    updateUI() {
        const levelElement = document.getElementById('current-level');
        const scoreElement = document.getElementById('current-score');
        const hintsElement = document.getElementById('hints-used');
        
        if (levelElement) levelElement.textContent = this.currentLevel;
        if (scoreElement) scoreElement.textContent = this.score;
        if (hintsElement) hintsElement.textContent = this.hintsUsed;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = this.getElapsedTime();
            const remaining = Math.max(0, this.gameData.timeLimit - elapsed);
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (remaining === 0) {
                this.gameOver();
            }
        }, 1000);
    }

    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    gameOver() {
        this.isGameActive = false;
        clearInterval(this.timer);
        
        // Haptic feedback for game over
        this.tg.HapticFeedback.notificationOccurred('error');
        
        this.tg.showAlert('Time\'s up! Game Over.');
    }

    async saveProgress() {
        const progress = {
            level: this.currentLevel,
            grid: this.grid,
            score: this.score,
            hints: this.hintsUsed,
            startTime: this.startTime,
            gameData: this.gameData
        };
        
        try {
            // Save to Telegram Cloud Storage
            await this.setCloudStorageItem('gameProgress', JSON.stringify(progress));
        } catch (error) {
            // Fallback to localStorage
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }
    }

    async loadProgress() {
        let saved;
        
        try {
            saved = await this.getCloudStorageItem('gameProgress');
        } catch (error) {
            saved = localStorage.getItem('gameProgress');
        }
        
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentLevel = progress.level;
            this.grid = progress.grid;
            this.score = progress.score;
            this.hintsUsed = progress.hints;
            this.startTime = progress.startTime;
            this.gameData = progress.gameData;
            return true;
        }
        return false;
    }

    applyTelegramTheme() {
        const themeParams = this.tg.themeParams;
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
    }

    setupMainButton() {
        this.tg.MainButton.setText('Save Progress');
        this.tg.MainButton.onClick(() => {
            this.saveProgress();
            this.tg.showAlert('Progress saved!');
        });
        this.tg.MainButton.show();
    }

    handleBackToMenu() {
        this.saveProgress();
        this.tg.close();
    }

    async setCloudStorageItem(key, value) {
         // Check if CloudStorage is available
         if (this.tg.CloudStorage && typeof this.tg.CloudStorage.setItem === 'function') {
             return new Promise((resolve, reject) => {
                 this.tg.CloudStorage.setItem(key, value, (error, result) => {
                     if (error) {
                         reject(error);
                     } else {
                         resolve(result);
                     }
                 });
             });
         } else {
             // Fallback to localStorage
             localStorage.setItem(key, value);
             return Promise.resolve();
         }
     }
 
     async getCloudStorageItem(key) {
         // Check if CloudStorage is available
         if (this.tg.CloudStorage && typeof this.tg.CloudStorage.getItem === 'function') {
             return new Promise((resolve, reject) => {
                 this.tg.CloudStorage.getItem(key, (error, result) => {
                     if (error) {
                         reject(error);
                     } else {
                         resolve(result);
                     }
                 });
             });
         } else {
             // Fallback to localStorage
             const value = localStorage.getItem(key);
             return Promise.resolve(value);
         }
     }

    shareScore() {
        const shareText = `🧩 Saya baru saja menyelesaikan Level ${this.currentLevel} di Teka-Teki Silang KBBI dengan skor ${this.score}! 🎯\n\nAyo ikut bermain dan asah kemampuan bahasa Indonesia kamu!`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
        this.tg.openTelegramLink(shareUrl);
        
        // Send completion data to bot
        this.sendCompletionDataToBot();
    }

    async saveCompletion(timeTaken) {
        const completionData = {
            level: this.currentLevel,
            score: this.score,
            time: timeTaken,
            date: new Date().toISOString()
        };
        
        // Save to progress
        let progressStr;
        try {
            progressStr = await this.getCloudStorageItem('crosswordProgress');
        } catch (error) {
            progressStr = localStorage.getItem('crosswordProgress');
        }
        
        let progress = JSON.parse(progressStr || '{}');
        if (!progress.completions) {
            progress.completions = [];
        }
        progress.completions.push(completionData);
        
        // Update unlocked level
        progress.unlockedLevel = Math.max(progress.unlockedLevel || 1, this.currentLevel + 1);
        progress.currentLevel = this.currentLevel + 1;
        
        try {
            await this.setCloudStorageItem('crosswordProgress', JSON.stringify(progress));
        } catch (error) {
            localStorage.setItem('crosswordProgress', JSON.stringify(progress));
        }
        
        // Clear game progress
        try {
            await this.setCloudStorageItem('gameProgress', '');
        } catch (error) {
            localStorage.removeItem('gameProgress');
        }
    }
    
    async clearGameProgress() {
        try {
            await this.setCloudStorageItem('gameProgress', '');
        } catch (error) {
            localStorage.removeItem('gameProgress');
        }
    }
    
    async getUserData() {
        // Get user data from Telegram
        const user = this.tg.initDataUnsafe?.user;
        if (user) {
            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                languageCode: user.language_code
            };
        }
        return null;
    }
    
    async sendCompletionDataToBot() {
        const userData = await this.getUserData();
        const completionData = {
            type: 'level_completed',
            user: userData,
            level: this.currentLevel,
            score: this.score,
            time: Math.floor((Date.now() - this.startTime) / 1000),
            hintsUsed: this.hintsUsed,
            timestamp: new Date().toISOString()
        };
        
        // Send data to bot
        this.tg.sendData(JSON.stringify(completionData));
    }
    
    async sendGameStartDataToBot() {
        const userData = await this.getUserData();
        const gameStartData = {
            type: 'game_started',
            user: userData,
            level: this.currentLevel,
            timestamp: new Date().toISOString()
        };
        
        this.tg.sendData(JSON.stringify(gameStartData));
    }
    
    async requestHelpFromBot() {
        this.tg.showPopup({
            title: 'Butuh Bantuan?',
            message: 'Apakah Anda ingin mendapatkan bantuan dari bot untuk level ini?',
            buttons: [{
                id: 'help_yes',
                type: 'default',
                text: 'Ya, minta bantuan'
            }, {
                id: 'help_no',
                type: 'cancel',
                text: 'Tidak'
            }]
        }, (buttonId) => {
            if (buttonId === 'help_yes') {
                const helpData = {
                    type: 'help_requested',
                    user: this.getUserData(),
                    level: this.currentLevel,
                    currentProgress: this.getCurrentProgress(),
                    timestamp: new Date().toISOString()
                };
                this.tg.sendData(JSON.stringify(helpData));
                this.tg.showAlert('Permintaan bantuan telah dikirim ke bot!');
            }
        });
    }
    
    getCurrentProgress() {
        const completedWords = this.words.filter(word => word.completed).length;
        const totalWords = this.words.length;
        const filledCells = this.grid.flat().filter(cell => cell && cell.letter).length;
        const totalCells = this.grid.flat().filter(cell => cell && cell.isActive).length;
        
        return {
            completedWords,
            totalWords,
            filledCells,
            totalCells,
            progressPercentage: Math.round((completedWords / totalWords) * 100)
        };
    }
    
    async inviteFriendsToCompete() {
        const userData = await this.getUserData();
        const inviteMessage = `🧩 ${userData?.firstName || 'Saya'} mengundang Anda untuk bermain Teka-Teki Silang KBBI!\n\n🎯 Level saat ini: ${this.currentLevel}\n⭐ Skor tertinggi: ${this.score}\n\nAyo buktikan siapa yang lebih jago bahasa Indonesia!`;
        
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(inviteMessage)}`;
        this.tg.openTelegramLink(shareUrl);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('crossword-grid')) {
        new CrosswordGame();
    }
});