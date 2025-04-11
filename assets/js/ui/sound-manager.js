// sound-manager.js - Handles all game audio effects

// Sound collection
const sounds = {
    move: new Audio('assets/sound/move.mp3'),
    capture: new Audio('assets/sound/capture.mp3'),
    check: new Audio('assets/sound/check.mp3'),
    checkmate: new Audio('assets/sound/checkmate.mp3'),
    castling: new Audio('assets/sound/castling.mp3'),
    incorrectMove: new Audio('assets/sound/incorrect-move.mp3'),
    promote: new Audio('assets/sound/promote.mp3')
};

// Create clone function to avoid interruption issues
function cloneAudio(original) {
    const clone = new Audio();
    clone.src = original.src;
    clone.volume = original.volume;
    return clone;
}

// Set volume for all sounds
function setVolume(level) {
    for (const sound in sounds) {
        sounds[sound].volume = level;
    }
}

// Default to half volume
setVolume(0.5);

// Sound state
let soundEnabled = true;

// Play a specific sound
export function playSound(soundName) {
    if (!soundEnabled) return;
    
    if (sounds[soundName]) {
        // Create a clone of the audio to avoid interruption issues
        const soundToPlay = cloneAudio(sounds[soundName]);
        
        // Play the sound
        soundToPlay.play().catch(error => {
            console.warn(`Error playing sound: ${error.message}`);
        });
    } else {
        console.warn(`Sound "${soundName}" not found`);
    }
}

// Toggle sound on/off
export function toggleSound() {
    soundEnabled = !soundEnabled;
    
    // Update the mute button text/icon
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.textContent = soundEnabled ? '🔊' : '🔇';
    }
    
    console.log(`Sound ${soundEnabled ? 'enabled' : 'disabled'}`);
    return soundEnabled;
}

// Initialize sound manager
export function initSoundManager() {
    // Preload sounds
    for (const sound in sounds) {
        sounds[sound].load();
    }
    
    // Set up mute button
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.addEventListener('click', toggleSound);
    }
}
