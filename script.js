const PIANO_CONFIG = {
    notes: [
        { note: 'C', key: 'A', frequency: 261.63, isBlack: false },
        { note: 'C#', key: 'W', frequency: 277.18, isBlack: true },
        { note: 'D', key: 'S', frequency: 293.66, isBlack: false },
        { note: 'D#', key: 'E', frequency: 311.13, isBlack: true },
        { note: 'E', key: 'D', frequency: 329.63, isBlack: false },
        { note: 'F', key: 'F', frequency: 349.23, isBlack: false },
        { note: 'F#', key: 'T', frequency: 369.99, isBlack: true },
        { note: 'G', key: 'G', frequency: 392.00, isBlack: false },
        { note: 'G#', key: 'Y', frequency: 415.30, isBlack: true },
        { note: 'A', key: 'H', frequency: 440.00, isBlack: false },
        { note: 'A#', key: 'U', frequency: 466.16, isBlack: true },
        { note: 'B', key: 'J', frequency: 493.88, isBlack: false }
    ],
    notesRow2: [
        { note: 'C2', key: 'A', frequency: 523.25, isBlack: false },
        { note: 'C#2', key: 'W', frequency: 554.37, isBlack: true },
        { note: 'D2', key: 'S', frequency: 587.33, isBlack: false },
        { note: 'D#2', key: 'E', frequency: 622.25, isBlack: true },
        { note: 'E2', key: 'D', frequency: 659.25, isBlack: false },
        { note: 'F2', key: 'F', frequency: 698.46, isBlack: false },
        { note: 'F#2', key: 'T', frequency: 739.99, isBlack: true },
        { note: 'G2', key: 'G', frequency: 783.99, isBlack: false },
        { note: 'G#2', key: 'Y', frequency: 830.61, isBlack: true },
        { note: 'A2', key: 'H', frequency: 880.00, isBlack: false },
        { note: 'A#2', key: 'U', frequency: 932.33, isBlack: true },
        { note: 'B2', key: 'J', frequency: 987.77, isBlack: false }
    ],
    blackKeyOffsets: {
        'C#': 41, 'D#': 101, 'F#': 221, 'G#': 281, 'A#': 341
    },
    blackKeyOffsetsMobile: {
        'C#': 31, 'D#': 76, 'F#': 166, 'G#': 211, 'A#': 256
    },
    blackKeyOffsetsTiny: {
        'C#': 24, 'D#': 59, 'F#': 128, 'G#': 163, 'A#': 198
    }
};

class VirtualPiano {
    constructor(config) {
        this.config = config;
        this.keyboard = document.getElementById('keyboard');
        this.shortcutsGrid = document.getElementById('shortcutsGrid');
        this.volumeSlider = document.getElementById('volume');
        this.volumeDisplay = document.getElementById('volumeDisplay');
        this.waveformSelect = document.getElementById('waveform');
        this.soundModeSelect = document.getElementById('soundMode');
        this.octaveSlider = document.getElementById('octave');
        this.octaveLabel = document.getElementById('octaveLabel');
        
        this.audioContext = null;
        this.mainGainNode = null;
        this.currentOscillators = new Map();
        this.volume = 0.5;
        this.waveform = 'sawtooth';
        this.soundMode = 'synth';
        this.octave = 0;

        this.init();
    }

    init() {
        this.initializeAudioContext();
        this.createKeys();
        this.createShortcuts();
        this.attachEventListeners();
        this.updateBlackKeyPositions();
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.mainGainNode = this.audioContext.createGain();
            this.mainGainNode.connect(this.audioContext.destination);
            this.mainGainNode.gain.value = this.volume;
        }
    }

    createKeys() {
        let wrapper = this.keyboard.querySelector('.keyboard-keys-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'keyboard-keys-wrapper';
            this.keyboard.appendChild(wrapper);
        }

        const mainFragment = document.createDocumentFragment();
        const currentNotes = this.octave === 0 ? this.config.notes : this.config.notesRow2;
        
        currentNotes.forEach((note) => {
            const keyEl = document.createElement('div');
            const keyClass = note.isBlack ? 'key-black' : 'key-white';
            keyEl.className = `key ${keyClass}`;
            keyEl.dataset.note = note.note;
            keyEl.dataset.key = note.key;
            keyEl.dataset.frequency = note.frequency;
            keyEl.dataset.noteName = note.note.replace('2', '');
            keyEl.innerHTML = `<span class="key-label">${note.key}</span>`;
            
            keyEl.addEventListener('mousedown', () => this.playNote(note.frequency, keyEl));
            keyEl.addEventListener('mouseup', () => this.stopNote(keyEl));
            keyEl.addEventListener('mouseleave', () => this.stopNote(keyEl));
            
            mainFragment.appendChild(keyEl);
        });

        wrapper.innerHTML = '';
        wrapper.appendChild(mainFragment);
    }

    updateBlackKeyPositions() {
        const wrapper = this.keyboard.querySelector('.keyboard-keys-wrapper');
        if (!wrapper) return;

        const blackKeys = wrapper.querySelectorAll('.key-black');
        const isMobile = window.innerWidth <= 768;
        const isTiny = window.innerWidth <= 480;
        
        const offsetMap = isTiny ? this.config.blackKeyOffsetsTiny : 
                         isMobile ? this.config.blackKeyOffsetsMobile : 
                         this.config.blackKeyOffsets;
        
        blackKeys.forEach(blackKey => {
            const noteName = blackKey.dataset.noteName;
            if (offsetMap[noteName]) {
                blackKey.style.left = offsetMap[noteName] + 'px';
            }
        });
    }

    createShortcuts() {
        const fragment = document.createDocumentFragment();
        const currentNotes = this.octave === 0 ? this.config.notes : this.config.notesRow2;
        
        currentNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `<span class="shortcut-key">${note.key}</span><span class="shortcut-note">${note.note}</span>`;
            fragment.appendChild(item);
        });

        this.shortcutsGrid.innerHTML = '';
        this.shortcutsGrid.appendChild(fragment);
    }

    attachEventListeners() {
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
            this.volumeDisplay.textContent = Math.round(this.volume * 100) + '%';
            this.mainGainNode.gain.value = this.volume;
        });

        this.waveformSelect.addEventListener('change', (e) => {
            this.waveform = e.target.value;
        });

        this.octaveSlider.addEventListener('input', (e) => {
            this.octave = parseInt(e.target.value);
            this.octaveLabel.textContent = this.octave === 0 ? 'Octave 1' : 'Octave 2';
            this.createKeys();
            this.createShortcuts();
            this.updateBlackKeyPositions();
        });

        window.addEventListener('resize', () => {
            this.updateBlackKeyPositions();
        });

        document.addEventListener('keydown', (e) => {
            const currentNotes = this.octave === 0 ? this.config.notes : this.config.notesRow2;
            const noteConfig = currentNotes.find(n => n.key.toUpperCase() === e.key.toUpperCase());
            if (noteConfig) {
                const keyEl = document.querySelector(`[data-key="${e.key.toUpperCase()}"][data-frequency="${noteConfig.frequency}"]`);
                if (keyEl && !this.currentOscillators.has(keyEl)) {
                    this.playNote(noteConfig.frequency, keyEl);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const currentNotes = this.octave === 0 ? this.config.notes : this.config.notesRow2;
            const noteConfig = currentNotes.find(n => n.key.toUpperCase() === e.key.toUpperCase());
            if (noteConfig) {
                const keyEl = document.querySelector(`[data-key="${e.key.toUpperCase()}"][data-frequency="${noteConfig.frequency}"]`);
                if (keyEl) this.stopNote(keyEl);
            }
        });
    }

    playNote(frequency, keyEl) {
        this.initializeAudioContext();
        if (this.currentOscillators.has(keyEl)) return;

        keyEl.classList.add('active');
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = this.waveform;
        oscillator.frequency.value = frequency;
        oscillator.connect(this.mainGainNode);
        this.currentOscillators.set(keyEl, oscillator);
        oscillator.start();
    }

    stopNote(keyEl) {
        if (!this.currentOscillators.has(keyEl)) return;

        const source = this.currentOscillators.get(keyEl);
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        source.disconnect();
        source.connect(gainNode);
        gainNode.connect(this.mainGainNode);
        source.stop(this.audioContext.currentTime + 0.1);
        
        this.currentOscillators.delete(keyEl);
        keyEl.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VirtualPiano(PIANO_CONFIG);
});

document.addEventListener('click', () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
    }
}, { once: true });