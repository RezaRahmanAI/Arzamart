export const PRODUCT_SIZE_ORDER = [
  "2", "4", "6", "8", "10", "12", "14", "16",
  "28", "30", "32", "34", "36", "38", "40", "42", "44",
  "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl"
];

export function sortProductSizes(sizes: string[]): string[] {
  if (!sizes) return [];
  
  return [...sizes].sort((a, b) => {
    const aIdx = PRODUCT_SIZE_ORDER.indexOf(a.toLowerCase());
    const bIdx = PRODUCT_SIZE_ORDER.indexOf(b.toLowerCase());
    
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    
    // If not in order list, try numeric comparison if both are numbers
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    
    return a.localeCompare(b);
  });
}
