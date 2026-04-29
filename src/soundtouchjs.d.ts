declare module 'soundtouchjs' {
  export class PitchShifter {
    constructor(
      context: AudioContext,
      buffer: AudioBuffer,
      bufferSize: number,
      onEnd?: () => void,
    );
    pitch: number;
    pitchSemitones: number;
    pitchOctaves: number;
    tempo: number;
    rate: number;
    readonly duration: number;
    readonly sampleRate: number;
    timePlayed: number;
    sourcePosition: number;
    percentagePlayed: number;
    readonly node: ScriptProcessorNode;
    connect(destination: AudioNode): void;
    disconnect(): void;
    on(eventName: string, cb: (detail: unknown) => void): void;
  }
}
