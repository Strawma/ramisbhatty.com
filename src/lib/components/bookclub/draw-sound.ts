export class DrawSound {
	private voices = new Set<OscillatorNode>();

	play(context: AudioContext, rotation: number, tickets: number, duration: number): void {
		this.stop();
		const start = context.currentTime;
		const slice = 360 / Math.max(1, tickets);
		if (duration > 0) {
			for (let angle = slice; angle < rotation; angle += slice) {
				// Invert the wheel's quartic ease-out to click exactly when a divider
				// reaches the pointer, even when rendering frames are delayed.
				const time = start + ((1 - (1 - angle / rotation) ** 0.25) * duration) / 1000;
				this.tone(context, 1100, time, 0.025, 0.035, 'triangle', 550);
			}
		}

		const landing = start + duration / 1000;
		// A rising major arpeggio resolves into a short chord, like a retro game win.
		[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
			this.tone(context, frequency, landing + index * 0.09, 0.19, 0.045, 'triangle');
		});
		[523.25, 659.25, 783.99, 1046.5].forEach((frequency) => {
			this.tone(context, frequency, landing + 0.38, 0.55, 0.025, 'triangle');
		});
	}

	private tone(
		context: AudioContext,
		frequency: number,
		start: number,
		duration: number,
		volume: number,
		type: OscillatorType,
		endFrequency = frequency
	): void {
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequency, start);
		oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(volume, start + 0.003);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(gain).connect(context.destination);
		this.voices.add(oscillator);
		oscillator.onended = () => {
			oscillator.disconnect();
			gain.disconnect();
			this.voices.delete(oscillator);
		};
		oscillator.start(start);
		oscillator.stop(start + duration + 0.01);
	}

	stop(): void {
		for (const voice of this.voices) {
			voice.stop();
			voice.disconnect();
		}
		this.voices.clear();
	}
}
