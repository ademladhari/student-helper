export type AmbientSound = {
  id: string;
  title: string;
  description: string;
  source: number;
};

export const ambientSounds: AmbientSound[] = [
  {
    id: 'lofi-soft-1',
    title: 'Lo-fi soft (Sample A)',
    description: 'Warm, mellow lofi texture',
    source: require('./chronopopofficial-lofi-sample-if-i-cant-have-you-330746.mp3'),
  },
  {
    id: 'lofi-soft-2',
    title: 'Lo-fi soft (Sample B)',
    description: 'Slow lofi loop with gentle layers',
    source: require('./deawthanapon-lofi-relax-beat-loop-bpm-88-eb-major-ii-v-i-361752.mp3'),
  },
  {
    id: 'lofi-soft-3',
    title: 'Lo-fi soft (Sample C)',
    description: 'Romantic jazzy lofi vibe',
    source: require('./vibehorn-lo-fi-music-romantic-jazzy-love-479215.mp3'),
  },
  {
    id: 'lofi-soft-4',
    title: 'Lo-fi soft (Sample D)',
    description: 'Alternate cut for variety',
    source: require('./chronopopofficial-lofi-sample-if-i-cant-have-you-330746 (1).mp3'),
  },
];
