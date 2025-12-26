'use client';

class MusicGenerator {
    private ctx: AudioContext | null = null;
    private isPlaying: boolean = false;
    private isMuted: boolean = false;
    private masterGain: GainNode | null = null;
    private nextNoteTime: number = 0;
    private current16thNote: number = 0;
    private tempo: number = 105; // Synthwave tempo
    private lookahead: number = 25.0; // ms
    private scheduleAheadTime: number = 0.1; // s
    private timerID: number | null = null;

    // Scales: C Minor Pentatonic / Dorian feel
    private bassNotes = [36, 36, 36, 36, 39, 39, 41, 41]; // C2, Eb2, F2
    private arpNotes = [60, 63, 67, 70, 72, 67, 63, 75]; // C4, Eb4, G4, Bb4, C5...

    constructor() { }

    public async init() {
        if (this.ctx) return;

        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx!.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.ctx!.destination);
    }

    public play() {
        if (!this.ctx) this.init();
        if (this.isPlaying) return;

        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }

        this.isPlaying = true;
        this.current16thNote = 0;
        this.nextNoteTime = this.ctx!.currentTime;
        this.scheduler();
    }

    public stop() {
        this.isPlaying = false;
        if (this.timerID !== null) window.clearTimeout(this.timerID);
    }

    public toggleMute(muted: boolean) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.3, this.ctx.currentTime, 0.1);
        }
    }

    private scheduler() {
        if (!this.isPlaying || !this.ctx) return;

        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            this.nextNote();
        }

        this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.current16thNote = (this.current16thNote + 1) % 16;
    }

    private scheduleNote(beatNumber: number, time: number) {
        // 1. Bass (Eighth notes)
        if (beatNumber % 2 === 0) {
            const noteIndex = Math.floor(beatNumber / 2) % 8;
            this.playBass(this.bassNotes[noteIndex], time);
        }

        // 2. Kick (Four on the floor)
        if (beatNumber % 4 === 0) {
            this.playKick(time);
        }

        // 3. Snare (Backbeat)
        if (beatNumber % 16 === 4 || beatNumber % 16 === 12) {
            this.playSnare(time);
        }

        // 4. Arpeggio (16th notes)
        const arpIndex = beatNumber % 8;
        // Add some variation
        if (Math.random() > 0.1) {
            this.playArp(this.arpNotes[arpIndex], time);
        }
    }

    // --- Instruments ---

    private playBass(midiNote: number, time: number) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = this.midiToFreq(midiNote);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.midiToFreq(midiNote), time);
        filter.frequency.exponentialRampToValueAtTime(500, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(time);
        osc.stop(time + 0.25);
    }

    private playArp(midiNote: number, time: number) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        // Slight detune for chorus effect
        const osc2 = this.ctx!.createOscillator();

        osc.type = 'square';
        osc2.type = 'sawtooth';

        osc.frequency.value = this.midiToFreq(midiNote);
        osc2.frequency.value = this.midiToFreq(midiNote) + 2; // Detune

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(time);
        osc.stop(time + 0.3);
        osc2.start(time);
        osc2.stop(time + 0.3);
    }

    private playKick(time: number) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    private playSnare(time: number) {
        const noiseBuffer = this.ctx!.createBuffer(1, this.ctx!.sampleRate * 0.1, this.ctx!.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx!.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.ctx!.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = this.ctx!.createGain();
        noiseGain.gain.setValueAtTime(0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain!);

        noise.start(time);
    }

    private midiToFreq(note: number) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }
}

export const musicGenerator = new MusicGenerator();
