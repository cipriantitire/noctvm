module.exports = {
  '*.{js,ts,tsx}': ['eslint --fix', () => 'tsc --noEmit'],
  '*.{test.ts,test.tsx}': ['vitest related --run'],
};
