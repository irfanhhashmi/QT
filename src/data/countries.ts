export interface Country {
  code: string;
  name: string;
  flag: string;
  continent?: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', continent: 'North America' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', continent: 'Europe' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', continent: 'North America' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', continent: 'Oceania' },
  { code: 'IN', name: 'India', flag: '🇮🇳', continent: 'Asia' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', continent: 'Asia' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', continent: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', continent: 'Europe' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', continent: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', continent: 'Middle East' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', continent: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', continent: 'Europe' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', continent: 'South America' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', continent: 'North America' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', continent: 'Asia' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', continent: 'Asia' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', continent: 'Asia' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', continent: 'Asia' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', continent: 'Europe/Asia' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', continent: 'Europe' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', continent: 'Europe' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', continent: 'Europe' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', continent: 'Europe' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', continent: 'Europe' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', continent: 'Europe' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', continent: 'Europe' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', continent: 'Europe' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', continent: 'Europe' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', continent: 'Oceania' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', continent: 'Asia' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', continent: 'Asia' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', continent: 'Asia' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', continent: 'Asia' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', continent: 'Asia' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', continent: 'Africa' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', continent: 'Africa' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', continent: 'Africa' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', continent: 'Africa' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', continent: 'Africa' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', continent: 'Africa' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', continent: 'South America' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', continent: 'South America' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', continent: 'South America' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', continent: 'South America' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', continent: 'Europe' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', continent: 'Europe' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', continent: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', continent: 'Europe' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', continent: 'Europe' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', continent: 'Europe' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', continent: 'Europe' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', continent: 'Europe/Asia' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', continent: 'Middle East' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', continent: 'Middle East' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', continent: 'Middle East' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', continent: 'Middle East' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', continent: 'Middle East' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', continent: 'Middle East' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', continent: 'Middle East' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', continent: 'Middle East' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', continent: 'Middle East' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', continent: 'Asia' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', continent: 'Asia' },
  { code: 'CN', name: 'China', flag: '🇨🇳', continent: 'Asia' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', continent: 'Asia' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', continent: 'Asia' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', continent: 'Africa' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', continent: 'Africa' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', continent: 'Africa' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', continent: 'Africa' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', continent: 'Africa' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', continent: 'South America' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', continent: 'South America' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', continent: 'South America' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', continent: 'North America' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', continent: 'North America' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', continent: 'North America' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', continent: 'North America' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', continent: 'Europe' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', continent: 'Europe' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', continent: 'Europe' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', continent: 'Europe' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', continent: 'Europe' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', continent: 'Europe' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', continent: 'Europe' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', continent: 'Europe' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', continent: 'Europe' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', continent: 'Europe' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', continent: 'Europe' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', continent: 'Europe' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', continent: 'Asia' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', continent: 'Asia' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', continent: 'Africa' },
];

export const POPULAR_COUNTRY_CODES = ['US', 'GB', 'CA', 'AU', 'IN', 'PK', 'DE', 'FR', 'AE', 'SA', 'ES', 'BR', 'MX', 'JP', 'TR'];

// Comprehensive mapping from IANA Timezone identifiers to ISO-2 Country Codes
export const TIMEZONE_TO_COUNTRY_MAP: Record<string, string> = {
  // Asia
  'Asia/Karachi': 'PK',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Dhaka': 'BD',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP',
  'Asia/Baghdad': 'IQ',
  'Asia/Tehran': 'IR',
  'Asia/Jerusalem': 'IL',
  'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Almaty': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Baku': 'AZ',
  'Asia/Tbilisi': 'GE',
  'Asia/Yerevan': 'AM',

  // Americas
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Los_Angeles': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Anchorage': 'US',
  'America/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/Mexico_City': 'MX',
  'America/Monterrey': 'MX',
  'America/Tijuana': 'MX',
  'America/Cancun': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Rio_Branco': 'BR',
  'America/Manaus': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Cordoba': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Guayaquil': 'EC',
  'America/Montevideo': 'UY',
  'America/Caracas': 'VE',
  'America/Panama': 'PA',
  'America/Costa_Rica': 'CR',
  'America/Santo_Domingo': 'DO',
  'America/Puerto_Rico': 'PR',

  // Europe
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT',
  'Europe/Brussels': 'BE',
  'Europe/Dublin': 'IE',
  'Europe/Warsaw': 'PL',
  'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Prague': 'CZ',
  'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU',
  'Europe/Kyiv': 'UA',
  'Europe/Moscow': 'RU',
  'Europe/Istanbul': 'TR',
  'Europe/Zagreb': 'HR',
  'Europe/Belgrade': 'RS',
  'Europe/Sofia': 'BG',
  'Europe/Bratislava': 'SK',
  'Europe/Ljubljana': 'SI',
  'Europe/Tallinn': 'EE',
  'Europe/Riga': 'LV',
  'Europe/Vilnius': 'LT',
  'Europe/Nicosia': 'CY',
  'Europe/Malta': 'MT',
  'Atlantic/Reykjavik': 'IS',
  'Europe/Luxembourg': 'LU',

  // Africa
  'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Nairobi': 'KE',
  'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ',
  'Africa/Tunis': 'TN',
  'Africa/Accra': 'GH',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kampala': 'UG',
  'Africa/Harare': 'ZW',

  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Pacific/Auckland': 'NZ',
};

export interface DetectedCountryResult {
  code: string;
  name: string;
  flag: string;
  isVerified: boolean;
  source: 'server_ip' | 'system_telemetry' | 'fallback';
}

export function detectCountryFromClient(): DetectedCountryResult {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY_MAP[tz]) {
      const code = TIMEZONE_TO_COUNTRY_MAP[tz];
      const country = getCountryByCode(code);
      if (country) {
        return {
          code: country.code,
          name: country.name,
          flag: country.flag,
          isVerified: true,
          source: 'system_telemetry',
        };
      }
    }

    // Try detecting from navigator languages (e.g. en-US, ur-PK, en-GB, fr-FR)
    if (typeof navigator !== 'undefined' && navigator.languages) {
      for (const lang of navigator.languages) {
        const parts = lang.split('-');
        if (parts.length === 2 && parts[1].length === 2) {
          const code = parts[1].toUpperCase();
          const country = getCountryByCode(code);
          if (country) {
            return {
              code: country.code,
              name: country.name,
              flag: country.flag,
              isVerified: true,
              source: 'system_telemetry',
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Client country detection error:', err);
  }

  // Default secure fallback
  return {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    isVerified: true,
    source: 'fallback',
  };
}

export function getCountryByCode(code?: string): Country | undefined {
  if (!code || code === 'any') return undefined;
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

export function getCountryFlag(code?: string): string {
  const found = getCountryByCode(code);
  return found ? found.flag : '🌐';
}

export function getCountryName(code?: string): string {
  const found = getCountryByCode(code);
  return found ? found.name : 'Worldwide';
}

