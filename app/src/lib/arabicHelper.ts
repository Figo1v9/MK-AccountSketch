interface ArabicCharDef {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  connectsBefore: boolean;
  connectsAfter: boolean;
}

const ARABIC_MAP: Record<string, ArabicCharDef> = {
  '\u0621': { isolated: '\uFE80', initial: '\uFE80', medial: '\uFE80', final: '\uFE80', connectsBefore: false, connectsAfter: false }, // ء
  '\u0622': { isolated: '\uFE81', initial: '\uFE81', medial: '\uFE82', final: '\uFE82', connectsBefore: true,  connectsAfter: false }, // آ
  '\u0623': { isolated: '\uFE83', initial: '\uFE83', medial: '\uFE84', final: '\uFE84', connectsBefore: true,  connectsAfter: false }, // أ
  '\u0624': { isolated: '\uFE85', initial: '\uFE85', medial: '\uFE86', final: '\uFE86', connectsBefore: true,  connectsAfter: false }, // ؤ
  '\u0625': { isolated: '\uFE87', initial: '\uFE87', medial: '\uFE88', final: '\uFE88', connectsBefore: true,  connectsAfter: false }, // إ
  '\u0626': { isolated: '\uFE89', initial: '\uFE8B', medial: '\uFE8C', final: '\uFE8A', connectsBefore: true,  connectsAfter: true  }, // ئ
  '\u0627': { isolated: '\uFE8D', initial: '\uFE8D', medial: '\uFE8E', final: '\uFE8E', connectsBefore: true,  connectsAfter: false }, // ا
  '\u0628': { isolated: '\uFE8F', initial: '\uFE91', medial: '\uFE92', final: '\uFE90', connectsBefore: true,  connectsAfter: true  }, // ب
  '\u0629': { isolated: '\uFE93', initial: '\uFE93', medial: '\uFE94', final: '\uFE94', connectsBefore: true,  connectsAfter: false }, // ة
  '\u062A': { isolated: '\uFE95', initial: '\uFE97', medial: '\uFE98', final: '\uFE96', connectsBefore: true,  connectsAfter: true  }, // ت
  '\u062B': { isolated: '\uFE99', initial: '\uFE9B', medial: '\uFE9C', final: '\uFE9A', connectsBefore: true,  connectsAfter: true  }, // ث
  '\u062C': { isolated: '\uFE9D', initial: '\uFE9F', medial: '\uFEA0', final: '\uFE9E', connectsBefore: true,  connectsAfter: true  }, // ج
  '\u062D': { isolated: '\uFEA1', initial: '\uFEA3', medial: '\uFEA4', final: '\uFEA2', connectsBefore: true,  connectsAfter: true  }, // ح
  '\u062E': { isolated: '\uFEA5', initial: '\uFEA7', medial: '\uFEA8', final: '\uFEA6', connectsBefore: true,  connectsAfter: true  }, // خ
  '\u062F': { isolated: '\uFEA9', initial: '\uFEA9', medial: '\uFEAA', final: '\uFEAA', connectsBefore: true,  connectsAfter: false }, // د
  '\u0630': { isolated: '\uFEAB', initial: '\uFEAB', medial: '\uFEAC', final: '\uFEAC', connectsBefore: true,  connectsAfter: false }, // ذ
  '\u0631': { isolated: '\uFEAD', initial: '\uFEAD', medial: '\uFEAE', final: '\uFEAE', connectsBefore: true,  connectsAfter: false }, // ر
  '\u0632': { isolated: '\uFEAF', initial: '\uFEAF', medial: '\uFEB0', final: '\uFEB0', connectsBefore: true,  connectsAfter: false }, // ز
  '\u0633': { isolated: '\uFEB1', initial: '\uFEB3', medial: '\uFEB4', final: '\uFEB2', connectsBefore: true,  connectsAfter: true  }, // س
  '\u0634': { isolated: '\uFEB5', initial: '\uFEB7', medial: '\uFEB8', final: '\uFEB6', connectsBefore: true,  connectsAfter: true  }, // ش
  '\u0635': { isolated: '\uFEB9', initial: '\uFEBB', medial: '\uFEBC', final: '\uFEBA', connectsBefore: true,  connectsAfter: true  }, // ص
  '\u0636': { isolated: '\uFEBD', initial: '\uFEBF', medial: '\uFEC0', final: '\uFEBE', connectsBefore: true,  connectsAfter: true  }, // ض
  '\u0637': { isolated: '\uFEC1', initial: '\uFEC3', medial: '\uFEC4', final: '\uFEC2', connectsBefore: true,  connectsAfter: true  }, // ط
  '\u0638': { isolated: '\uFEC5', initial: '\uFEC7', medial: '\uFEC8', final: '\uFEC6', connectsBefore: true,  connectsAfter: true  }, // ظ
  '\u0639': { isolated: '\uFEC9', initial: '\uFECA', medial: '\uFECC', final: '\uFECA', connectsBefore: true,  connectsAfter: true  }, // ع
  '\u063A': { isolated: '\uFECD', initial: '\uFECF', medial: '\uFED0', final: '\uFECE', connectsBefore: true,  connectsAfter: true  }, // غ
  '\u0641': { isolated: '\uFED1', initial: '\uFED3', medial: '\uFED4', final: '\uFED2', connectsBefore: true,  connectsAfter: true  }, // ف
  '\u0642': { isolated: '\uFED5', initial: '\uFED7', medial: '\uFED8', final: '\uFED6', connectsBefore: true,  connectsAfter: true  }, // ق
  '\u0643': { isolated: '\uFED9', initial: '\uFEDB', medial: '\uFEDC', final: '\uFEDA', connectsBefore: true,  connectsAfter: true  }, // ك
  '\u0644': { isolated: '\uFEDD', initial: '\uFEDF', medial: '\uFEE0', final: '\uFEDE', connectsBefore: true,  connectsAfter: true  }, // ل
  '\u0645': { isolated: '\uFEE1', initial: '\uFEE3', medial: '\uFEE4', final: '\uFEE2', connectsBefore: true,  connectsAfter: true  }, // م
  '\u0646': { isolated: '\uFEE5', initial: '\uFEE7', medial: '\uFEE8', final: '\uFEE6', connectsBefore: true,  connectsAfter: true  }, // ن
  '\u0647': { isolated: '\uFEE9', initial: '\uFEEB', medial: '\uFEEC', final: '\uFEEA', connectsBefore: true,  connectsAfter: true  }, // ه
  '\u0648': { isolated: '\uFEED', initial: '\uFEED', medial: '\uFEEE', final: '\uFEEE', connectsBefore: true,  connectsAfter: false }, // و
  '\u0649': { isolated: '\uFEEF', initial: '\uFEEF', medial: '\uFEF0', final: '\uFEF0', connectsBefore: true,  connectsAfter: false }, // ى
  '\u064A': { isolated: '\uFEF1', initial: '\uFEF3', medial: '\uFEF4', final: '\uFEF2', connectsBefore: true,  connectsAfter: true  }, // ي

  // Ligatures (mapped to Private Use Area for internal processing)
  '\uE000': { isolated: '\uFEF5', initial: '\uFEF5', medial: '\uFEF6', final: '\uFEF6', connectsBefore: true, connectsAfter: false }, // لا Madda
  '\uE001': { isolated: '\uFEF7', initial: '\uFEF7', medial: '\uFEF8', final: '\uFEF8', connectsBefore: true, connectsAfter: false }, // لا Hamza above
  '\uE002': { isolated: '\uFEF9', initial: '\uFEF9', medial: '\uFEFA', final: '\uFEFA', connectsBefore: true, connectsAfter: false }, // لا Hamza below
  '\uE003': { isolated: '\uFEFB', initial: '\uFEFB', medial: '\uFEFC', final: '\uFEFC', connectsBefore: true, connectsAfter: false }, // لا Normal
};

function isArabicChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0600 && code <= 0x06FF) ||
    (code >= 0x0750 && code <= 0x077F) ||
    (code >= 0x08A0 && code <= 0x08FF) ||
    (code >= 0xFB50 && code <= 0xFDFF) ||
    (code >= 0xFE70 && code <= 0xFEFF) ||
    char === '\uE000' ||
    char === '\uE001' ||
    char === '\uE002' ||
    char === '\uE003'
  );
}

export function hasArabic(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (isArabicChar(text[i])) return true;
  }
  return false;
}

function preprocessLigatures(text: string): string {
  return text
    .replace(/لآ/g, '\uE000')
    .replace(/لأ/g, '\uE001')
    .replace(/لإ/g, '\uE002')
    .replace(/لا/g, '\uE003');
}

function shapeArabicText(text: string): string {
  const preprocessed = preprocessLigatures(text);
  let result = '';

  for (let i = 0; i < preprocessed.length; i++) {
    const char = preprocessed[i];
    if (!ARABIC_MAP[char]) {
      result += char;
      continue;
    }

    const prev = i > 0 ? preprocessed[i - 1] : null;
    const next = i < preprocessed.length - 1 ? preprocessed[i + 1] : null;

    const connectsToPrev = !!(prev && ARABIC_MAP[prev] && ARABIC_MAP[prev].connectsAfter && ARABIC_MAP[char].connectsBefore);
    const connectsToNext = !!(next && ARABIC_MAP[next] && ARABIC_MAP[next].connectsBefore && ARABIC_MAP[char].connectsAfter);

    if (connectsToPrev && connectsToNext) {
      result += ARABIC_MAP[char].medial;
    } else if (connectsToPrev) {
      result += ARABIC_MAP[char].final;
    } else if (connectsToNext) {
      result += ARABIC_MAP[char].initial;
    } else {
      result += ARABIC_MAP[char].isolated;
    }
  }

  return result;
}

function reverseAndMirror(text: string): string {
  let result = '';
  for (let i = text.length - 1; i >= 0; i--) {
    const char = text[i];
    if (char === '(') result += ')';
    else if (char === ')') result += '(';
    else if (char === '[') result += ']';
    else if (char === ']') result += '[';
    else if (char === '{') result += '}';
    else if (char === '}') result += '{';
    else if (char === '<') result += '>';
    else if (char === '>') result += '<';
    else result += char;
  }
  return result;
}

function getCharDirection(char: string): 'RTL' | 'LTR' | 'NEUTRAL' {
  if (isArabicChar(char)) return 'RTL';
  if (/[a-zA-Z0-9]/.test(char)) return 'LTR';
  return 'NEUTRAL';
}

function tokenize(text: string): { dir: 'RTL' | 'LTR'; text: string }[] {
  const tokens: { dir: 'RTL' | 'LTR'; text: string }[] = [];
  if (!text) return tokens;

  let currentDir: 'RTL' | 'LTR' | null = null;
  let currentText = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const dir = getCharDirection(char);

    if (dir === 'NEUTRAL') {
      if (currentDir === null) {
        let resolvedDir: 'RTL' | 'LTR' = 'LTR';
        for (let j = i + 1; j < text.length; j++) {
          const nextDir = getCharDirection(text[j]);
          if (nextDir !== 'NEUTRAL') {
            resolvedDir = nextDir === 'RTL' ? 'RTL' : 'LTR';
            break;
          }
        }
        currentDir = resolvedDir;
      }
      currentText += char;
    } else {
      const targetDir = dir === 'RTL' ? 'RTL' : 'LTR';
      if (currentDir === null) {
        currentDir = targetDir;
        currentText += char;
      } else if (currentDir === targetDir) {
        currentText += char;
      } else {
        tokens.push({ dir: currentDir, text: currentText });
        currentDir = targetDir;
        currentText = char;
      }
    }
  }

  if (currentText) {
    tokens.push({ dir: currentDir || 'LTR', text: currentText });
  }

  return tokens;
}

/**
 * Standardizes Arabic characters, performs text shaping, and reverses text/tokens correctly
 * for display inside non-Arabic (LTR) PDF canvases.
 */
export function fixArabicBidi(text: string): string {
  if (!text || !hasArabic(text)) {
    return text;
  }

  const tokens = tokenize(text);
  const processedTokens = tokens.map(token => {
    if (token.dir === 'RTL') {
      const shaped = shapeArabicText(token.text);
      return reverseAndMirror(shaped);
    }
    return token.text;
  });

  // Since the overall reading order of RTL is right-to-left,
  // we must reverse the order of the tokens on the LTR line.
  return processedTokens.reverse().join('');
}
