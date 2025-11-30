const PIANO_CONFIG = {
    rows: [
        {
            name: 'Row 1 (ASDFGHJK)',
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
            ]
        },
        {
            name: 'Row 2 (QWERTYUIOP)',
            notes: [
                { note: 'C2', key: 'Q', frequency: 523.25, isBlack: false },
                { note: 'C#2', key: 'W', frequency: 554.37, isBlack: true },
                { note: 'D2', key: 'E', frequency: 587.33, isBlack: false },
                { note: 'D#2', key: 'R', frequency: 622.25, isBlack: true },
                { note: 'E2', key: 'T', frequency: 659.25, isBlack: false },
                { note: 'F2', key: 'Y', frequency: 698.46, isBlack: false },
                { note: 'F#2', key: 'U', frequency: 739.99, isBlack: true },
                { note: 'G2', key: 'I', frequency: 783.99, isBlack: false },
                { note: 'G#2', key: 'O', frequency: 830.61, isBlack: true },
                { note: 'A2', key: 'P', frequency: 880.00, isBlack: false }
            ]
        }
    ]
};

class VirtualPiano {
    constructor(config) {
        this.config = config;
        this.keyboard = document.getElementById('keyboard');
        this.shortcutsGrid = document.getElementById('shortcutsGrid');
        this.volumeSlider = document.getElementById('volume');
        this.volumeDisplay = document.getElementById('volumeDisplay');
        this.waveformSelect = document.getElementById('waveform');
        
        this.audioContext = null;
        this.mainGainNode = null;
        this.currentOscillators = new Map();
        this.volume = 0.5;
        this.waveform = 'sawtooth';

        this.init();
    }

    async init() {
        this.initializeAudioContext();
        this.createKeys();
        this.createShortcuts();
        this.attachEventListeners();
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            const audioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new audioContextClass();
            
            this.mainGainNode = this.audioContext.createGain();
            this.mainGainNode.connect(this.audioContext.destination);
            this.mainGainNode.gain.value = this.volume;
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }
    }

    createKeys() {
        const mainFragment = document.createDocumentFragment();
        
        this.config.rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            const rowFragment = document.createDocumentFragment();
            
            row.notes.forEach((note, index) => {
                const keyEl = document.createElement('div');
                const keyClass = note.isBlack ? 'key-black' : 'key-white';
                keyEl.className = `key ${keyClass}`;
                keyEl.dataset.note = note.note;
                keyEl.dataset.key = note.key;
                keyEl.dataset.frequency = note.frequency;
                keyEl.innerHTML = `<span class="key-label">${note.key}</span>`;
                
                keyEl.addEventListener('mousedown', () => this.playNote(note.frequency, keyEl));
                keyEl.addEventListener('mouseup', () => this.stopNote(keyEl));
                keyEl.addEventListener('mouseleave', () => this.stopNote(keyEl));
                
                keyEl.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.playNote(note.frequency, keyEl);
                });
                keyEl.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.stopNote(keyEl);
                });
                
                rowFragment.appendChild(keyEl);
            });
            
            rowEl.appendChild(rowFragment);
            mainFragment.appendChild(rowEl);
        });

        this.keyboard.appendChild(mainFragment);
    }

    createShortcuts() {
        const fragment = document.createDocumentFragment();
        
        this.config.rows.forEach((row, rowIndex) => {
            const rowLabel = document.createElement('div');
            rowLabel.style.gridColumn = '1 / -1';
            rowLabel.style.fontSize = '11px';
            rowLabel.style.fontWeight = '600';
            rowLabel.style.color = '#999';
            rowLabel.style.textTransform = 'uppercase';
            rowLabel.style.marginTop = rowIndex === 0 ? '0' : '8px';
            rowLabel.textContent = row.name;
            fragment.appendChild(rowLabel);
            
            row.notes.forEach(note => {
                const item = document.createElement('div');
                item.className = 'shortcut-item';
                item.innerHTML = `
                    <span class="shortcut-key">${note.key}</span>
                    <span class="shortcut-note">${note.note}</span>
                `;
                fragment.appendChild(item);
            });
        });

        this.shortcutsGrid.appendChild(fragment);
    }

    attachEventListeners() {
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
            const percentage = Math.round(this.volume * 100);
            this.volumeDisplay.textContent = `${percentage}%`;
            
            if (this.mainGainNode) {
                this.mainGainNode.gain.value = this.volume;
            }
        });

        this.waveformSelect.addEventListener('change', (e) => {
            this.waveform = e.target.value;
        });

        document.addEventListener('keydown', (e) => {
            let noteConfig = null;
            let keyEl = null;
            
            for (const row of this.config.rows) {
                noteConfig = row.notes.find(n => n.key.toUpperCase() === e.key.toUpperCase());
                if (noteConfig) {
                    keyEl = document.querySelector(`[data-key="${e.key.toUpperCase()}"][data-frequency="${noteConfig.frequency}"]`);
                    break;
                }
            }
            
            if (noteConfig && keyEl && !this.currentOscillators.has(keyEl)) {
                e.preventDefault();
                this.playNote(noteConfig.frequency, keyEl);
            }
        });

        document.addEventListener('keyup', (e) => {
            let noteConfig = null;
            let keyEl = null;
            
            for (const row of this.config.rows) {
                noteConfig = row.notes.find(n => n.key.toUpperCase() === e.key.toUpperCase());
                if (noteConfig) {
                    keyEl = document.querySelector(`[data-key="${e.key.toUpperCase()}"][data-frequency="${noteConfig.frequency}"]`);
                    break;
                }
            }
            
            if (noteConfig && keyEl) {
                this.stopNote(keyEl);
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

        const oscillator = this.currentOscillators.get(keyEl);
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.disconnect();
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGainNode);
        
        oscillator.stop(this.audioContext.currentTime + 0.1);
        this.currentOscillators.delete(keyEl);
        
        keyEl.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VirtualPiano(PIANO_CONFIG);
});

document.addEventListener('click', () => {
    const audioContextClass = window.AudioContext || window.webkitAudioContext;
    if (audioContextClass) {
        const ctx = new audioContextClass();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    }
}, { once: true });