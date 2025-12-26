export interface Theme {
  primary: string;
  accent: string;
  destructive: string;
  background: string;
}

export const themes: Theme[] = [
  // Level 1: Default Neon
  {
    primary: '180 100% 50%', // Cyan
    accent: '300 100% 65%',  // Magenta
    destructive: '0 84% 60%', // Red
    background: '240 10% 3%', // Dark Blue
  },
  // Level 2: Sunset Drive
  {
    primary: '25 95% 53%', // Orange
    accent: '330 100% 50%',// Hot Pink
    destructive: '60 100% 50%',// Yellow
    background: '260 30% 5%', // Deep Purple
  },
  // Level 3: Emerald City
  {
    primary: '145 63% 42%', // Green
    accent: '200 100% 50%',// Bright Blue
    destructive: '45 100% 50%',// Gold
    background: '180 15% 5%', // Dark Teal
  },
  // Level 4: Crimson Core
  {
    primary: '0 100% 50%', // Red
    accent: '0 0% 100%',  // White
    destructive: '300 100% 50%',// Magenta
    background: '0 40% 4%', // Deep Red-Black
  },
  // Level 5: Galactic Void
  {
    primary: '270 100% 60%', // Purple
    accent: '210 100% 60%', // Light Blue
    destructive: '180 100% 50%', // Cyan
    background: '240 20% 2%', // Near Black
  },
    // Level 6: Solar Flare
  {
    primary: '45 100% 50%', // Yellow/Gold
    accent: '15 90% 55%', // Bright Orange
    destructive: '0 100% 65%', // Bright Red
    background: '20 20% 8%', // Warm Dark Brown
  },
];
