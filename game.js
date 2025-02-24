import DummyAI from './dummyai.js';

class Planet {
    constructor(x, y, size, troops = 0, owner = 'neutral') {
        this.x = x;
        this.y = y;
        this.size = size;
        this.troops = troops;
        this.owner = owner;
        this.productionRate = size / 20; // Larger planets produce more troops
    }
}

class TroopMovement {
    constructor(from, to, amount, owner) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.owner = owner;
        this.progress = 0;
        this.startX = from.x;
        this.startY = from.y;
        this.dx = to.x - from.x;
        this.dy = to.y - from.y;
        this.distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        // Adjusted speed calculation based on distance
        this.speed = 150; // pixels per second
        this.duration = this.distance / this.speed; // seconds to reach target
    }

    update(dt) {
        this.progress += dt / this.duration;
        return this.progress >= 1;
    }

    getCurrentPosition() {
        const easedProgress = this.progress; // Can add easing function here if desired
        return {
            x: this.startX + this.dx * easedProgress,
            y: this.startY + this.dy * easedProgress
        };
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.planets = [];
        this.troopMovements = [];
        this.selectedPlanet = null;
        this.selectedPlanets = []; // Array to store multiple selected planets
        this.isSelecting = false; // Flag for selection box
        this.selectionStart = { x: 0, y: 0 }; // Starting point of selection box
        this.selectionEnd = { x: 0, y: 0 }; // Ending point of selection box
        this.timeRemaining = 300; // 5 minutes in seconds
        this.lastUpdate = Date.now();
        this.mousePos = { x: 0, y: 0 };
        this.gameOver = false;
        this.startTime = Date.now();
        
        // Debug log element
        this.debugLog = document.createElement('div');
        this.debugLog.id = 'debug-log';
        this.debugLog.style.position = 'absolute';
        this.debugLog.style.top = '50px';
        this.debugLog.style.left = '10px';
        this.debugLog.style.color = '#fff';
        this.debugLog.style.fontSize = '10px';
        this.debugLog.style.fontFamily = 'monospace';
        this.debugLog.style.textAlign = 'left';
        this.debugLog.style.pointerEvents = 'none'; // Don't interfere with clicks
        document.getElementById('game-screen').appendChild(this.debugLog);
        
        // Initialize AI
        this.ai = new DummyAI(this);

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Add mouse event listeners
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Add touch event listeners
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        this.generatePlanets();
        this.gameLoop();
        
        console.log("Game initialized");
    }

    // Debug logging function
    log(message) {
        console.log(message);
        this.debugLog.innerHTML += message + '<br>';
        // Keep only the last 10 messages
        const lines = this.debugLog.innerHTML.split('<br>');
        if (lines.length > 10) {
            this.debugLog.innerHTML = lines.slice(lines.length - 10).join('<br>');
        }
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        // Update selection box if currently selecting
        if (this.isSelecting) {
            this.selectionEnd.x = this.mousePos.x;
            this.selectionEnd.y = this.mousePos.y;
        }
    }

    handleMouseDown(e) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Start selection box
        this.selectionStart.x = x;
        this.selectionStart.y = y;
        this.selectionEnd.x = x;
        this.selectionEnd.y = y;
        this.isSelecting = true;
    }

    handleMouseUp(e) {
        if (this.gameOver) return;
        
        this.isSelecting = false;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // If it's a small movement, treat it as a click
        const distMoved = Math.sqrt(
            Math.pow(this.selectionStart.x - x, 2) + 
            Math.pow(this.selectionStart.y - y, 2)
        );
        
        if (distMoved < 5) {
            this.handleClick(e);
            return;
        }
        
        // Process selection box
        this.processSelectionBox();
    }

    handleTouchStart(e) {
        if (this.gameOver) return;
        
        e.preventDefault(); // Prevent scrolling
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.selectionStart.x = x;
            this.selectionStart.y = y;
            this.selectionEnd.x = x;
            this.selectionEnd.y = y;
            this.isSelecting = true;
            
            // Store timestamp to detect tap vs drag
            this.touchStartTime = Date.now();
        }
    }

    handleTouchMove(e) {
        if (this.gameOver) return;
        
        e.preventDefault(); // Prevent scrolling
        
        if (e.touches.length === 1 && this.isSelecting) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            this.mousePos.x = touch.clientX - rect.left;
            this.mousePos.y = touch.clientY - rect.top;
            
            this.selectionEnd.x = this.mousePos.x;
            this.selectionEnd.y = this.mousePos.y;
        }
    }

    handleTouchEnd(e) {
        if (this.gameOver) return;
        
        e.preventDefault(); // Prevent default behavior
        
        this.isSelecting = false;
        
        // If it was a short touch with minimal movement, treat as a tap
        const touchDuration = Date.now() - this.touchStartTime;
        const distMoved = Math.sqrt(
            Math.pow(this.selectionStart.x - this.selectionEnd.x, 2) + 
            Math.pow(this.selectionStart.y - this.selectionEnd.y, 2)
        );
        
        if (touchDuration < 300 && distMoved < 10) {
            // Create a synthetic click event
            const clickEvent = {
                clientX: this.selectionEnd.x + this.canvas.getBoundingClientRect().left,
                clientY: this.selectionEnd.y + this.canvas.getBoundingClientRect().top
            };
            this.handleClick(clickEvent);
            return;
        }
        
        // Process selection box for drag
        this.processSelectionBox();
    }

    processSelectionBox() {
        // Normalize selection box coordinates
        const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const right = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const bottom = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        // Clear previous selection if not holding shift
        this.selectedPlanets = [];
        
        // Find all player planets within the selection box
        for (const planet of this.planets) {
            if (planet.owner === 'player') {
                // Check if planet is within or touched by the selection box
                if (planet.x + planet.size >= left && 
                    planet.x - planet.size <= right && 
                    planet.y + planet.size >= top && 
                    planet.y - planet.size <= bottom) {
                    this.selectedPlanets.push(planet);
                }
            }
        }
        
        // If no planets selected, clear selection
        if (this.selectedPlanets.length === 0) {
            this.selectedPlanet = null;
        } else {
            // For backward compatibility, set selectedPlanet to the first selected planet
            this.selectedPlanet = this.selectedPlanets[0];
        }
    }

    handleClick(e) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedPlanet = this.planets.find(planet => {
            const dx = x - planet.x;
            const dy = y - planet.y;
            return Math.sqrt(dx * dx + dy * dy) < planet.size;
        });

        // If clicking on empty space, clear selection
        if (!clickedPlanet) {
            this.selectedPlanet = null;
            this.selectedPlanets = [];
            return;
        }

        // If we have planets selected and click on a different planet
        if (this.selectedPlanets.length > 0 && !this.selectedPlanets.includes(clickedPlanet)) {
            if (this.selectedPlanets.every(planet => planet.owner === 'player')) {
                // Send troops from all selected planets
                for (const sourcePlanet of this.selectedPlanets) {
                    // Calculate distance for proportional troop sending
                    const dx = clickedPlanet.x - sourcePlanet.x;
                    const dy = clickedPlanet.y - sourcePlanet.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Send fewer troops from further planets to arrive approximately together
                    const troopsToSend = Math.floor(sourcePlanet.troops / 2);
                    
                    if (troopsToSend > 0) {
                        sourcePlanet.troops -= troopsToSend;
                        this.troopMovements.push(new TroopMovement(
                            sourcePlanet,
                            clickedPlanet,
                            troopsToSend,
                            'player'
                        ));
                    }
                }
                
                // Clear selection after sending troops
                this.selectedPlanet = null;
                this.selectedPlanets = [];
            }
        } 
        // If clicking on a player's planet, select it
        else if (clickedPlanet.owner === 'player') {
            this.selectedPlanet = clickedPlanet;
            this.selectedPlanets = [clickedPlanet];
        }
    }

    generatePlanets() {
        // Player's starting planet
        const playerPlanet = new Planet(
            this.canvas.width * 0.2,
            this.canvas.height * 0.8,
            30,
            30,
            'player'
        );
        this.planets.push(playerPlanet);

        // AI's starting planet
        const aiPlanet = new Planet(
            this.canvas.width * 0.8,
            this.canvas.height * 0.2,
            30,
            30,
            'ai'
        );
        this.planets.push(aiPlanet);

        // Generate neutral planets
        for (let i = 0; i < 8; i++) {
            let attempts = 0;
            let valid = false;
            
            while (!valid && attempts < 100) {
                const size = 15 + Math.random() * 20;
                const x = size + Math.random() * (this.canvas.width - size * 2);
                const y = size + Math.random() * (this.canvas.height - size * 2);
                
                valid = this.isValidPlanetPosition(x, y, size);
                
                if (valid) {
                    this.planets.push(new Planet(x, y, size, 10, 'neutral'));
                    break;
                }
                attempts++;
            }
        }
    }

    isValidPlanetPosition(x, y, size) {
        const minDistance = 80; // Minimum distance between planet centers
        
        for (const planet of this.planets) {
            const dx = x - planet.x;
            const dy = y - planet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                return false;
            }
        }
        return true;
    }

    drawTrajectory() {
        if (this.selectedPlanets.length > 0) {
            // Find planet under mouse cursor
            const targetPlanet = this.planets.find(planet => {
                const dx = this.mousePos.x - planet.x;
                const dy = this.mousePos.y - planet.y;
                return Math.sqrt(dx * dx + dy * dy) < planet.size;
            });

            if (targetPlanet && !this.selectedPlanets.includes(targetPlanet)) {
                // Draw trajectory lines from all selected planets
                for (const selectedPlanet of this.selectedPlanets) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(selectedPlanet.x, selectedPlanet.y);
                    this.ctx.lineTo(targetPlanet.x, targetPlanet.y);
                    this.ctx.strokeStyle = '#ffffff44'; // Semi-transparent white
                    this.ctx.setLineDash([5, 5]); // Dashed line
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
                this.ctx.setLineDash([]); // Reset dash
            }
        }
    }

    // Check if a player has any planets
    hasPlayerPlanets(player) {
        return this.planets.some(planet => planet.owner === player);
    }

    // Check if a player has any troops in movement
    hasPlayerTroopsInMovement(player) {
        return this.troopMovements.some(movement => movement.owner === player);
    }

    // Calculate total troops for any player
    calculateTotalTroops(player) {
        // Sum troops from planets
        const planetTroops = this.planets
            .filter(planet => planet.owner === player)
            .reduce((total, planet) => total + planet.troops, 0);
        
        // Sum troops from movements
        const movementTroops = this.troopMovements
            .filter(movement => movement.owner === player)
            .reduce((total, movement) => total + movement.amount, 0);
        
        return planetTroops + movementTroops;
    }

    // Check win conditions
    checkWinConditions() {
        if (this.gameOver) return false;

        // Check for time victory
        if (this.timeRemaining <= 0) {
            this.log("Time victory triggered");
            // Find player with most troops
            const playerTroops = this.calculateTotalTroops('player');
            const aiTroops = this.calculateTotalTroops('ai');
            
            const winner = playerTroops >= aiTroops ? 'player' : 'ai';
            
            this.endGame(winner, 'time');
            return true;
        }

        // Check for domination victories

        // First check if AI is eliminated
        const aiHasPlanets = this.hasPlayerPlanets('ai');
        const aiHasTroops = this.hasPlayerTroopsInMovement('ai');
        
        if (!aiHasPlanets && !aiHasTroops) {
            this.log("AI eliminated - player wins");
            const timeTaken = (Date.now() - this.startTime) / 1000; // in seconds
            this.endGame('player', 'domination', timeTaken);
            return true;
        }
        
        // Then check if player is eliminated
        const playerHasPlanets = this.hasPlayerPlanets('player');
        const playerHasTroops = this.hasPlayerTroopsInMovement('player');
        
        if (!playerHasPlanets && !playerHasTroops) {
            this.log("Player eliminated - AI wins");
            const timeTaken = (Date.now() - this.startTime) / 1000; // in seconds
            this.endGame('ai', 'domination', timeTaken);
            return true;
        }
        
        return false;
    }

    // End the game and show game over screen
    endGame(winner, victoryType, timeTaken = null) {
        this.log(`Game over! ${winner} wins by ${victoryType}`);
        this.gameOver = true;
        
        // Calculate final stats
        const playerTroops = Math.floor(this.calculateTotalTroops('player'));
        const aiTroops = Math.floor(this.calculateTotalTroops('ai'));
        
        // Create game over screen
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        
        let gameOverHTML = `
            <h1>GAME OVER</h1>
            <h2>${winner.toUpperCase()} WINS!</h2>
            <h3>${victoryType.toUpperCase()} VICTORY</h3>
        `;
        
        if (victoryType === 'domination' && timeTaken) {
            const minutes = Math.floor(timeTaken / 60);
            const seconds = Math.floor(timeTaken % 60);
            gameOverHTML += `<p>Victory achieved in ${minutes}:${seconds.toString().padStart(2, '0')}</p>`;
        }
        
        gameOverHTML += `<h3>FINAL STANDINGS</h3><ul>`;
        
        // Sort by troop count
        const standings = [
            { player: 'player', troops: playerTroops },
            { player: 'ai', troops: aiTroops }
        ].sort((a, b) => b.troops - a.troops);
        
        for (const stat of standings) {
            gameOverHTML += `<li>${stat.player.toUpperCase()}: ${stat.troops} troops</li>`;
        }
        
        gameOverHTML += `</ul><button class="menu-button" id="play-again-button">PLAY AGAIN</button>`;
        
        gameOverScreen.innerHTML = gameOverHTML;
        document.getElementById('game-container').appendChild(gameOverScreen);
        
        // Add event listener to play again button
        document.getElementById('play-again-button').addEventListener('click', () => {
            window.location.reload();
        });
    }

    update() {
        if (this.gameOver) return;

        const now = Date.now();
        const dt = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;

        // Update timer
        this.timeRemaining -= dt;
        
        // Check win conditions - do this before updating anything else
        if (this.checkWinConditions()) {
            return; // Game is over, stop updates
        }

        // Update planet troops
        for (const planet of this.planets) {
            if (planet.owner !== 'neutral') {
                planet.troops = Math.min(999, planet.troops + planet.productionRate * dt);
            }
        }

        // Update troop movements
        for (let i = this.troopMovements.length - 1; i >= 0; i--) {
            const movement = this.troopMovements[i];
            if (movement.update(dt)) {
                // Troops have arrived
                const targetPlanet = movement.to;
                if (targetPlanet.owner === movement.owner) {
                    targetPlanet.troops += movement.amount;
                } else {
                    targetPlanet.troops -= movement.amount;
                    if (targetPlanet.troops < 0) {
                        targetPlanet.owner = movement.owner;
                        targetPlanet.troops = Math.abs(targetPlanet.troops);
                    }
                }
                this.troopMovements.splice(i, 1);
                
                // After troop movements complete, check win conditions again
                this.checkWinConditions();
            }
        }

        // Let AI make a decision if it's not eliminated
        if (this.hasPlayerPlanets('ai') || this.hasPlayerTroopsInMovement('ai')) {
            const aiDecision = this.ai.makeDecision({
                planets: this.planets,
                troopMovements: this.troopMovements
            });

            if (aiDecision) {
                aiDecision.from.troops -= aiDecision.troops;
                this.troopMovements.push(new TroopMovement(
                    aiDecision.from,
                    aiDecision.to,
                    aiDecision.troops,
                    'ai'
                ));
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw trajectory lines first (so they're behind everything)
        this.drawTrajectory();

        // Draw selection box if active
        if (this.isSelecting) {
            const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
            const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
            const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
            
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 3]);
            this.ctx.strokeRect(left, top, width, height);
            this.ctx.setLineDash([]);
            
            // Semi-transparent fill
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
            this.ctx.fillRect(left, top, width, height);
        }

        // Draw planets
        for (const planet of this.planets) {
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.strokeStyle = planet.owner === 'player' ? '#ffff00' : 
                                 planet.owner === 'neutral' ? '#ffffff' :
                                 planet.owner === 'ai' ? '#ff0000' : '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw selection highlight for all selected planets
            if (this.selectedPlanets.includes(planet)) {
                this.ctx.beginPath();
                this.ctx.arc(planet.x, planet.y, planet.size + 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.stroke();
            }

            // Draw troop count
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Math.floor(planet.troops), planet.x, planet.y + 5);
        }

        // Draw troop movements
        for (const movement of this.troopMovements) {
            const pos = movement.getCurrentPosition();
            
            // Draw movement trail
            this.ctx.beginPath();
            this.ctx.moveTo(movement.startX, movement.startY);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.strokeStyle = '#ffffff22';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Draw troops
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = movement.owner === 'player' ? '#ffff00' : '#ff0000';
            this.ctx.fill();

            // Draw troop count
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(movement.amount, pos.x, pos.y - 10);
        }

        // Update timer display
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    gameLoop() {
        this.update();
        this.draw();
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game when the Begin button is clicked
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const beginButton = document.getElementById('begin-button');

beginButton.addEventListener('click', () => {
    menuScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    new Game();
});

export default Game;