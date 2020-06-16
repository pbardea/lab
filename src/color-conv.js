/*
 * L*a*b <-> XYZ <-> sRGB
 *
 */

// D65 is a standard white-point, defined in CIE XYZ.
// https://en.wikipedia.org/wiki/Illuminant_D65.
const D65 = {
  x: 95.047,
  y: 100,
  z: 108.883
}

// HLCToHex converts a color from the HLC color space to a hex code that can be
// rendered in a browser. If the conversion is not possible, empty string will
// be returned.
const HLCToHex = (hlc) => {
  const lab = hlcToLab(hlc)
  const xyz = labToXyz(lab)
  const rgb = xyzToRgb(xyz)
  return rgbToHex(rgb)
}


// hlcToLab converts a color from the cylindrical HLC color space to the
// cartesian Lab color space.
const hlcToLab = (hlc) => {
  return {
    l: hlc.l,
    a: hlc.c * Math.cos(hlc.h),
    b: hlc.c * Math.sin(hlc.h)
  }
}


// labToXyz converts a color from the CIE Lab color space to one in the CIE XYZ
// color space the transformation can be found at:
// https://en.wikipedia.org/wiki/CIELAB_color_space.
// This transformation uses the standard D65 whitepoint.
const labToXyz = (lab) => {
  let y = (lab.l + 16) / 116;
  let x = lab.a / 500 + y;
  let z = y - lab.b / 200;

  [x, y, z] = [x, y, z].map(v => {
    if (v ** 3 > 0.008856) {
      return v ** 3
    } else {
      return (v - 16 / 116) / 7.787
    }
  });

  // Adjst for whitepoint.
  x = x * D65.x;
  y = y * D65.y;
  z = z * D65.z;

  return {x: x, y: y, z: z}
}

// xyzToRgb turns a color from the rgb color space to one in the sRGB color
// space. You can find the transformation matrix at:
// https://en.wikipedia.org/wiki/SRGB
// This also clips any channel (R, G, or B) to NaN if the color lies outside the
// sRGB color space.
const xyzToRgb = (xyz) => {
  // Apply the matrix transformation to conver the color spaces.
  // The result after the matrix conversion is our linear RGB values.
  var rgb = {
    r: xyz.x *  3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986,
    g: xyz.x * -0.9689 + xyz.y *  1.8758 + xyz.z *  0.0415,
    b: xyz.x *  0.0557 + xyz.y * -0.2040 + xyz.z *  1.0570
  };

  // Then apply gamma correction.  We apply gamma correction because our eyes
  // have a harder time differentiating dark colors from brighter ones, so we
  // want to assign more bits to the brighter colors.
  ["r", "g", "b"].forEach(function(key) {
    rgb[key] /= 100;
    if (rgb[key] > 0.0031308) {
      rgb[key] = 1.055 * Math.pow(rgb[key], (1 / 2.4)) - 0.055;
    } else {
      rgb[key] *= 12.92;
    }

    // Clip colors that are outside of this color space.
    if (rgb[key] < 0) {
      rgb[key] = NaN
    } else if (rgb[key] > 1) {
      rgb[key] = NaN
    }
  });

  return rgb;
}

// rgbToHex does a standard converstion of taking a color in the rgb color
// space where each channel falls between 0 and 1 and maps it to a hex code (1
// byte per channel).
// If any channel is NaN - we return empty string.
const rgbToHex = (rgb) => {
  var channels = [rgb.r, rgb.g, rgb.b]

  // Check if we got an invalid color and return early.
  var invalid = false;
  channels.forEach(val => { if (isNaN(val)) { invalid = true } } )
  if (invalid) {
    return ""
  }

  // First, translate [0, 1] range to integers in [0, 255].
  // Then, bit-shift the channels (red by 16, green by 8, blue by 0)
  // Finally logical-or them all together.
  const colorVal = channels.map((channel) => Math.floor(channel * 255))
        .map((channel, i) => channel << ( 8 * ( 3 - (i+1))))
        .reduce((acc, val) => acc | val, 0)

  // Interpret the integer as hex and pad any 0s to make the 6 six-characters
  // (e.g. F0CE1 -> 0F0CE1)
  return "#" + colorVal
    .toString(16)
    .padStart(6, "0")
    .toUpperCase();
}

export default HLCToHex
