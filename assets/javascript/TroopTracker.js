export default class TroopTracker {
    constructor(game) {
        this.game = game;
        this.headerElement = document.querySelector('header h1');
        this.originalTitle = this.headerElement.textContent;
        this.headerContainer = document.querySelector('header');
        
        // Remove any existing troop bars first (cleanup from previous games)
        this.cleanupExistingBars();
        
        // Create and append the troop bar container
        this.troopBarContainer = document.createElement('div');
        this.troopBarContainer.id = 'troop-bar-container';
        this.troopBarContainer.style.display = 'none'; // Hidden by default
        this.headerContainer.appendChild(this.troopBarContainer);
        
        // Store reference to player colors from PlayersController instead
        this.playerColors = this.game.playersController.playerColors;
    }
    
    // Clean up any existing troop bars from previous games
    cleanupExistingBars() {
        // Remove all existing troop bar containers
        const existingBars = document.querySelectorAll('#troop-bar-container');
        existingBars.forEach(bar => bar.remove());
    }
    
    // Show the troop bar (called when game starts)
    showTroopBar() {
        this.headerElement.style.display = 'none';
        
        // Make sure we're not showing multiple bars
        this.cleanupExistingBars();
        
        // Reattach our container if needed
        if (!this.troopBarContainer.parentNode) {
            this.headerContainer.appendChild(this.troopBarContainer);
        }
        
        this.troopBarContainer.style.display = 'flex';
        this.update(); // Initial update
    }
    
    // Hide the troop bar and show title (called when game ends/returns to menu)
    hideTroopBar() {
        this.headerElement.style.display = 'block';
        
        // Actually remove the container instead of just hiding it
        if (this.troopBarContainer && this.troopBarContainer.parentNode) {
            this.troopBarContainer.remove();
        }
    }
    
    // Update the troop bar based on current game state
    update() {
        if (!this.troopBarContainer || this.troopBarContainer.style.display === 'none') return;
        
        const players = this.game.playersController.players;
        let totalTroops = 0;
        const playerTroops = {};
        
        // Calculate total troops and troops per player
        for (const planet of this.game.planets) {
            if (planet.owner !== null) {
                if (!playerTroops[planet.owner]) {
                    playerTroops[planet.owner] = 0;
                }
                playerTroops[planet.owner] += planet.troops;
                totalTroops += planet.troops;
            }
        }
        
        // Add troops in transit
        for (const movement of this.game.troopMovements) {
            if (!playerTroops[movement.owner]) {
                playerTroops[movement.owner] = 0;
            }
            playerTroops[movement.owner] += movement.amount;
            totalTroops += movement.amount;
        }
        
        // Clear previous bar segments
        this.troopBarContainer.innerHTML = '';
        
        // Create the bar container
        const barElement = document.createElement('div');
        barElement.id = 'troop-bar';
        this.troopBarContainer.appendChild(barElement);
        
        // Add troops count inside the bar
        const troopCountElement = document.createElement('div');
        troopCountElement.id = 'total-troops-count';
        troopCountElement.textContent = `${Math.round(totalTroops)}`;
        barElement.appendChild(troopCountElement);
        
        // Define a consistent order for all players
        const orderedPlayerIds = [
            'player1', 'player2', 'player3', 'player4', 
            'player5', 'player6', 'neutral'
        ];
        
        // Create segments for each player in the predefined order
        for (const playerId of orderedPlayerIds) {
            // Only create segments for players with troops
            if (playerTroops[playerId] && playerTroops[playerId] > 0) {
                const percentage = (playerTroops[playerId] / totalTroops) * 100;
                const segment = document.createElement('div');
                segment.className = 'troop-bar-segment';
                segment.style.width = `${percentage}%`;
                
                // Get color directly from player ID
                const color = this.playerColors[playerId] || '#888'; // Fallback color
                segment.style.backgroundColor = color;
                
                // Add tooltip with player info
                segment.title = `Player ${playerId}: ${Math.round(playerTroops[playerId])} troops (${percentage.toFixed(1)}%)`;
                
                barElement.appendChild(segment);
            }
        }
    }
        
    // Properly dispose of resources when game ends
    dispose() {
        this.hideTroopBar();
        this.troopBarContainer = null;
    }
}