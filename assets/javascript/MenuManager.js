import Game from '../../game.js';
import GameOverScreen from './GameOverScreen.js';

class MenuManager {
    constructor() {
        // DOM references
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.timer = document.getElementById('timer');
        
        // Make MenuManager globally accessible for GameState
        window.menuManager = this;
        
        // Create game over screen instance
        this.gameOverScreen = new GameOverScreen(document.getElementById('game-container'));
        
        // Track current screen
        this.currentScreen = 'menu';
        
        // AI Types - single source of truth
        this.aiOptions = [
            { value: 'claude1', name: 'Claude I' },
            { value: 'claude2', name: 'Claude II' },
            { value: 'claude1a', name: 'Claude III' },
            { value: 'claude2a', name: 'Claude IV' },
            { value: 'defensive', name: 'Defensive' },
            { value: 'dummy', name: 'Big Dummy' },
            { value: 'advanced', name: 'Claude 0' }
        ];
        
        // Store configuration from menu selections
        this.gameConfig = {
            gameMode: 'singleplayer', // Default game mode
            playerCount: 2, // Default: 1 human + 1 AI
            aiTypes: ['claude1'], // Default AI type
            botBattleCount: 2 // Default number of AI players in bot battle
        };
        
        // Initialize the menu
        this.initializeMainMenu();
    }

    // Switch between screens (menu, game, game-over)
    switchToScreen(screenName) {
        // Hide all screens first
        this.menuScreen.style.display = 'none';
        this.gameScreen.style.display = 'none';
        
        // Remove game over screen if it exists
        this.gameOverScreen.remove();
        
        // Show the requested screen
        switch(screenName) {
            case 'menu':
                this.menuScreen.style.display = 'flex';
                break;
            case 'game':
                this.gameScreen.style.display = 'block';
                break;
            case 'gameover':
                // Game over screen is handled separately by GameOverScreen
                break;
            default:
                console.error('Unknown screen:', screenName);
        }
        
        this.currentScreen = screenName;
    }
    
    // Create and show game over screen with leaderboard
    showGameOver(stats, gameInstance) {
        this.game = gameInstance;
        // Use the GameOverScreen instance to show the game over screen
        this.gameOverScreen.show(stats, gameInstance);
    }

    // Helper method to format time in MM:SS format
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Helper method to get friendly display name for players - kept for backward compatibility
    getPlayerDisplayName(player) {
        if (!player.isAI) {
            return 'Player';
        }
        
        // Find the matching AI option to get the display name
        const aiOption = this.aiOptions.find(option => option.value === player.aiController);
        return aiOption ? aiOption.name : player.aiController;
    }
    
    // Initialize the main menu with game mode selection
    initializeMainMenu() {
        const menuContainer = this.getOrCreateMenuContainer();
        
        // Clear existing menu
        menuContainer.innerHTML = '';
        
        // Create game mode buttons
        const gameModes = [
            { id: 'botbattle', name: 'BOT BATTLE', description: 'Pit AI against each other' },
            { id: 'singleplayer', name: 'SINGLE PLAYER', description: 'Battle the AI' },
            { id: 'multiplayer', name: 'MULTIPLAYER', description: 'Battle other humans' }
        ];
        
        const gameModeContainer = document.createElement('div');
        gameModeContainer.className = 'game-mode-container';
        
        gameModes.forEach(mode => {
            const modeButton = document.createElement('div');
            modeButton.className = 'game-mode-button';
            modeButton.dataset.mode = mode.id;
            
            // Bot Battle is now available, Single Player is available, but Multiplayer isn't
            const isAvailable = mode.id === 'singleplayer' || mode.id === 'botbattle';
            if (!isAvailable) {
                modeButton.classList.add('coming-soon');
            }
            
            modeButton.innerHTML = `
                <h3>${mode.name}</h3>
                <p>${mode.description}</p>
                ${isAvailable ? '' : '<span class="badge">COMING SOON</span>'}
            `;
            
            modeButton.addEventListener('click', () => {
                if (isAvailable) {
                    this.gameConfig.gameMode = mode.id;
                    this.showGameSetup(mode.id);
                }
            });
            
            gameModeContainer.appendChild(modeButton);
        });
        
        menuContainer.appendChild(gameModeContainer);
    }
    
    // Helper to get or create menu container
    getOrCreateMenuContainer() {
        let menuContainer = document.querySelector('#menu-screen .menu-container');
        if (!menuContainer) {
            menuContainer = document.createElement('div');
            menuContainer.className = 'menu-container';
            this.menuScreen.appendChild(menuContainer);
        }
        return menuContainer;
    }
    
    // Show game setup screen based on selected mode
    showGameSetup(gameMode) {
        const menuContainer = this.getOrCreateMenuContainer();
        
        // Clear existing menu
        menuContainer.innerHTML = '';
        
        // Add back button
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = '← BACK';
        backButton.addEventListener('click', () => {
            this.initializeMainMenu();
        });
        menuContainer.appendChild(backButton);
        
        // Create title based on game mode
        const setupTitle = document.createElement('h2');
        setupTitle.textContent = gameMode === 'singleplayer' ? 'SINGLE PLAYER SETUP' : 
                                (gameMode === 'botbattle' ? 'BOT BATTLE SETUP' : 'MULTIPLAYER SETUP');
        setupTitle.className = 'menu-title';
        menuContainer.appendChild(setupTitle);
        
        // Create appropriate setup form based on game mode
        switch(gameMode) {
            case 'singleplayer':
                this.createGameSetup(menuContainer, 1, 3, 'OPPONENTS', 'START GAME', false);
                break;
            case 'botbattle':
                this.createGameSetup(menuContainer, 2, 4, 'NUMBER OF BOTS', 'START BATTLE', true);
                break;
            case 'multiplayer':
                // Multiplayer setup would go here when implemented
                break;
        }
    }
    
    // Unified game setup for both singleplayer and bot battle
    createGameSetup(menuContainer, minCount, maxCount, countLabel, startButtonText, isBotBattle) {
        const setupForm = document.createElement('div');
        setupForm.className = 'setup-form';
        
        // Count selection (opponents or bots)
        const countContainer = document.createElement('div');
        countContainer.className = 'setup-section';
        
        const countLabelElement = document.createElement('h2');
        countLabelElement.textContent = countLabel;
        countContainer.appendChild(countLabelElement);
        
        const countSelect = document.createElement('div');
        countSelect.className = 'player-count-select';
        
        for (let i = minCount; i <= maxCount; i++) {
            const countButton = document.createElement('button');
            countButton.className = 'count-button';
            countButton.textContent = i;
            countButton.dataset.count = i;
            countButton.setAttribute('aria-label', `${i} ${isBotBattle ? 'bots' : 'opponent' + (i > 1 ? 's' : '')}`);
            countButton.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.count-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                countButton.classList.add('active');
                
                // Store count in config
                if (isBotBattle) {
                    this.gameConfig.botBattleCount = parseInt(i);
                } else {
                    this.gameConfig.playerCount = parseInt(i) + 1; // +1 for human player
                }
                
                // Update AI selectors
                this.updateEntitySelectors(i, isBotBattle);
            });
            
            // Set default selected
            if (i === minCount) {
                countButton.classList.add('active');
            }
            
            countSelect.appendChild(countButton);
        }
        
        countContainer.appendChild(countSelect);
        setupForm.appendChild(countContainer);
        
        // AI/Bot selection container
        const selectionContainer = document.createElement('div');
        selectionContainer.className = 'setup-section';
        selectionContainer.id = isBotBattle ? 'bot-selection' : 'ai-selection';
        
        setupForm.appendChild(selectionContainer);
        
        // Start button
        const startButton = document.createElement('button');
        startButton.className = 'menu-button start-game';
        startButton.textContent = startButtonText;
        startButton.addEventListener('click', () => {
            const count = document.querySelector('.count-button.active').dataset.count;
            
            // Collect AI types
            const aiTypes = [];
            for (let i = 1; i <= count; i++) {
                const selector = document.querySelector(`#${isBotBattle ? 'bot' : 'ai'}-type-${i}`);
                aiTypes.push(selector.value);
            }
            
            // Update config
            this.gameConfig.aiTypes = aiTypes;
            this.gameConfig.playerCount = isBotBattle ? parseInt(count) : parseInt(count) + 1;
            
            // Start the game
            this.startGame();
        });
        
        setupForm.appendChild(startButton);
        menuContainer.appendChild(setupForm);
        
        // Initialize selectors with default count
        this.updateEntitySelectors(minCount, isBotBattle);
    }
    
    // Unified method to update AI/Bot selectors
    updateEntitySelectors(count, isBotBattle) {
        const selectionId = isBotBattle ? 'bot-selection' : 'ai-selection';
        const selectionContainer = document.getElementById(selectionId);
        selectionContainer.innerHTML = '';
        
        // Create a container for the selectors
        const selectorsContainer = document.createElement('div');
        selectorsContainer.className = 'ai-selectors-container';
        selectionContainer.appendChild(selectorsContainer);
        
        for (let i = 1; i <= count; i++) {
            const container = document.createElement('div');
            container.className = 'ai-selector';
            
            // Create unique ID for the select element
            const selectId = `${isBotBattle ? 'bot' : 'ai'}-type-${i}`;
            
            const label = document.createElement('label');
            label.htmlFor = selectId;
            
            // Only show labels for bot battle mode
            if (isBotBattle) {
                label.textContent = `Bot ${i}`;
            }
            
            container.appendChild(label);
            
            const selector = document.createElement('select');
            selector.id = selectId;
            selector.name = selectId;
            selector.setAttribute('aria-label', isBotBattle ? 
                `Bot ${i} type` : 
                `Opponent ${i} difficulty`);
            
            // Add AI options from the central aiOptions array
            this.aiOptions.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.name;
                selector.appendChild(option);
            });
            
            container.appendChild(selector);
            selectorsContainer.appendChild(container);
        }
    }
    
    // Start a new game with current configuration
    startGame() {
        // Hide menu and show game
        this.menuScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        
        // Create new Game instance with the current configuration
        switch(this.gameConfig.gameMode) {
            case 'singleplayer':
                new Game(this.gameConfig.playerCount, this.gameConfig.aiTypes);
                break;
            case 'botbattle':
                new Game(this.gameConfig.botBattleCount, this.gameConfig.aiTypes, true);
                break;
            case 'multiplayer':
                // Handle multiplayer mode when implemented
                break;
        }
    }
    
    // Get current game configuration
    getGameConfig() {
        return this.gameConfig;
    }
}

// Initialize menu when the script loads
const menuManager = new MenuManager();

export default MenuManager;