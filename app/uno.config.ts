import { defineConfig, presetUno, presetTypography } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography()
  ],
  theme: {
    colors: {
      border: '#000000',
      'zinc-900': '#18181b',
      'zinc-100': '#f4f4f5',
      income: '#FF90E8',
      margin: '#74F0ED',
      break: '#FFBD2E',
      balance: '#8AFF92',
      cogs: '#CFFBFF',
      roi: '#AEFFED',
      liquidity: '#DABFFF',
    }
  },
  rules: [
    ['shadow-brutal-card', { 'box-shadow': '6px 6px 0px #000' }],
    ['shadow-brutal-btn', { 'box-shadow': '4px 4px 0px #000' }],
    ['shadow-brutal-hover', { 'box-shadow': '8px 8px 0px #000' }],
    ['shadow-brutal-active', { 'box-shadow': '0px 0px 0px #000' }],
  ],
  shortcuts: {
    'brutal-card': 'bg-white border-4 border-black shadow-brutal-card transition-all duration-200',
    'brutal-btn': 'bg-white border-4 border-black shadow-brutal-btn font-outfit font-black cursor-pointer transition-all duration-100 flex items-center gap-2 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-active',
    'brutal-input': 'w-full border-3 border-black p-2 font-black font-inherit outline-none bg-white text-sm text-center',
    'flex-center': 'flex justify-center items-center',
  }
})
