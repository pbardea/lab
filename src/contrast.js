//  Assumes that the colors passed in are in RGB format [0.0, 1.0]
const ContrastRatio = (c1, c2) => {
    const l1 = (relativeLum(hexToRgb(c1)) / relativeLum(hexToRgb(c2))).toFixed(2)
    const l2 = (relativeLum(hexToRgb(c2)) / relativeLum(hexToRgb(c1))).toFixed(2)
    return Math.max(l1, l2)
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

const relativeLum = (color) => {
    const r = conv(color.r)
    const g = conv(color.g)
    const b = conv(color.b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const conv = (value) => {
    return value <= 0.03928 ? value/12.92 : ((value+0.055)/1.055) ^ 2.4
}

export default ContrastRatio;
