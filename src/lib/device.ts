/**
 * Description lisible de l'appareil envoyée au login (`deviceInfo`), affichée dans
 * « Appareils connectés » : « Chrome – Android 14 – Pixel 7 », « Safari – iOS 17 – iPhone ».
 */
export function describeDevice(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
  const navigateur =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Navigateur'

  let systeme = 'Appareil'
  let modele: string | null = null
  const android = ua.match(/Android (\d+(?:\.\d+)?)/)
  const ios = ua.match(/OS (\d+)[._]\d+.* like Mac OS X/)
  if (android) {
    systeme = `Android ${android[1]}`
    const m = ua.match(/Android [^;]+;\s*([^;)]+?)(?:\s+Build|\))/)
    if (m && !/^(K|wv|Linux)$/i.test(m[1].trim())) modele = m[1].trim()
  } else if (ios) {
    systeme = `iOS ${ios[1]}`
    modele = /iPad/.test(ua) ? 'iPad' : 'iPhone'
  } else if (/Windows NT/.test(ua)) systeme = 'Windows'
  else if (/Mac OS X/.test(ua)) systeme = 'macOS'
  else if (/Linux/.test(ua)) systeme = 'Linux'

  return [navigateur, systeme, modele].filter(Boolean).join(' – ').slice(0, 120)
}
