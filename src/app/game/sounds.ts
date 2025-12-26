'use client';

import { type SoundEffect } from './types';

// This is a placeholder for a real audio implementation.
// In a real app, you would use a library like Howler.js or the Web Audio API
// to load and play sound files.

// Since we can't add binary assets, we'll just log to the console for now.
const soundEnabled = false; // Set to true to see console logs

export function playSound(effect: SoundEffect) {
  if (soundEnabled) {
    console.log(`PLAY_SOUND: ${effect}`);
  }
  
  // Example of what a real implementation might look like:
  /*
  const audio = new Audio(`/sounds/${effect}.wav`);
  audio.play();
  */
}
