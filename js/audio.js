/**
 * Web Audio Synthesizer for Anti-Gravity Soundscape
 * Procedurally generates futuristic zero-g hums, mechanical deconstruction whooshes,
 * and magnetic reassembly docking clicks with zero external audio assets.
 */

window.RE_Audio = (function () {
    let audioCtx = null;
    let isMuted = true; // Safe default for browsers, toggled by UI button
    let isInitialized = false;

    let humOsc = null;
    let humGain = null;
    let lfoOsc = null;
    let filterNode = null;

    function init() {
        if (isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            audioCtx = new AudioContext();

            // Master Filter
            filterNode = audioCtx.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 240;

            // Zero-G Sub Hum Oscillator
            humOsc = audioCtx.createOscillator();
            humOsc.type = 'sine';
            humOsc.frequency.value = 52; // 52Hz deep cosmic hum

            // LFO for subtle levitation flutter
            lfoOsc = audioCtx.createOscillator();
            lfoOsc.type = 'sine';
            lfoOsc.frequency.value = 0.8; // 0.8 Hz slow wave

            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 12; // Modulate frequency by +/- 12Hz
            lfoOsc.connect(lfoGain);
            lfoGain.connect(humOsc.frequency);

            humGain = audioCtx.createGain();
            humGain.gain.value = 0; // Starts silent until unmuted

            humOsc.connect(filterNode);
            filterNode.connect(humGain);
            humGain.connect(audioCtx.destination);

            humOsc.start();
            lfoOsc.start();
            isInitialized = true;
        } catch (e) {
            console.warn('Web Audio not available or blocked:', e);
        }
    }

    function toggleAudio() {
        if (!isInitialized) init();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        isMuted = !isMuted;

        if (humGain && audioCtx) {
            const target = isMuted ? 0 : 0.12;
            humGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.2);
        }
        return !isMuted;
    }

    // Dynamic modulation based on drag deconstruction progress
    function update(progress, dragSpeed) {
        if (!isInitialized || isMuted || !audioCtx) return;

        // Open filter and raise frequency as bike deconstructs
        const targetFreq = 160 + progress * 420 + Math.min(300, dragSpeed * 250);
        filterNode.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.15);

        // Adjust drone volume slightly with kinetic activity
        const targetVol = 0.08 + progress * 0.14 + Math.min(0.1, dragSpeed * 0.05);
        humGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.1);
    }

    // Play Magnetic Lock / Reassembly Snap Sound
    function playMagneticLock() {
        if (!isInitialized || isMuted || !audioCtx) return;

        const now = audioCtx.currentTime;

        // Transient click oscillator
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Play Subtle UI Click
    function playUiClick() {
        if (!isInitialized || isMuted || !audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(840, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.05);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    return {
        init,
        toggleAudio,
        update,
        playMagneticLock,
        playUiClick,
        isMuted: () => isMuted
    };
})();
