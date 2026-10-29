export const PALETTE = ['#ffc93c', '#ff6fae', '#4cc9f0', '#3ddc97', '#9b5de5', '#ff8c42', '#7bdff2', '#f7aef8']

export const colorFor = (i: number) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]
