import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  // Check if the input is valid
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove leading and trailing spaces, and replace multiple spaces with a single space.
  const cleanName = name.trim().replace(/\s+/g, " ");

  // Split the name into an array of words.
  const words = cleanName.split(" ");

  // Extract the first letter of each word and convert it to uppercase.
  const initials = words.map((word) => word[0]?.toUpperCase()).join("");

  return initials;
}

export function getFirstName(name: string): string {
  // Check if the input is valid
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove leading and trailing spaces, and replace multiple spaces with a single space.
  const cleanName = name.trim().replace(/\s+/g, " ");

  // Split the name into an array of words.
  const words = cleanName.split(" ");

  // Return the first word as the first name.
  return words[0] || "";
}

export function getLastName(name: string): string {
  // Check if the input is valid
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove leading and trailing spaces, and replace multiple spaces with a single space.
  const cleanName = name.trim().replace(/\s+/g, " ");

  // Split the name into an array of words.
  const words = cleanName.split(" ");
  const names = getInitials(words[1]);
  // Return the first word as the first name.
  return names || "";
}

// utils/sortOptions.ts
export const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Highest Price", value: "highest_price" },
  { label: "Lowest Price", value: "lowest_price" },
  { label: "Top Customer Reviews", value: "top_reviews" },
];

export function separateStringByComma(string: string) {
  /**
   * Separates a string of words by commas and returns an array of words.
   *
   * @param {string} string - The input string containing words separated by commas.
   * @returns {string[]} An array of words.
   */
  return string
    .split("_")
    .map((word) => word.trim())
    .join(" ");
}

export function formatPhone(phone: string) {
  if (phone.startsWith("0")) return phone.replace(/^0/, "+234");
  if (phone.startsWith("234")) return `+${phone}`;
  return phone;
}

// List of all countries
export const countries = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AS", label: "American Samoa" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AI", label: "Anguilla" },
  { value: "AQ", label: "Antarctica" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AW", label: "Aruba" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BM", label: "Bermuda" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BV", label: "Bouvet Island" },
  { value: "BR", label: "Brazil" },
  { value: "IO", label: "British Indian Ocean Territory" },
  { value: "VG", label: "British Virgin Islands" },
  { value: "BN", label: "Brunei Darussalam" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CV", label: "Cape Verde" },
  { value: "KY", label: "Cayman Islands" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CX", label: "Christmas Island" },
  { value: "CC", label: "Cocos (Keeling) Islands" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo, The Democratic Republic Of The" },
  { value: "CK", label: "Cook Islands" },
  { value: "CR", label: "Costa Rica" },
  { value: "CI", label: "Cote D'Ivoire" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FK", label: "Falkland Islands (Malvinas)" },
  { value: "FO", label: "Faroe Islands" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GF", label: "French Guiana" },
  { value: "PF", label: "French Polynesia" },
  { value: "TF", label: "French Southern Territories" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GI", label: "Gibraltar" },
  { value: "GR", label: "Greece" },
  { value: "GL", label: "Greenland" },
  { value: "GD", label: "Grenada" },
  { value: "GP", label: "Guadeloupe" },
  { value: "GU", label: "Guam" },
  { value: "GT", label: "Guatemala" },
  { value: "GG", label: "Guernsey" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HM", label: "Heard and McDonald Islands" },
  { value: "VA", label: "Holy See (Vatican City State)" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran, Islamic Republic Of" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IM", label: "Isle Of Man" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JE", label: "Jersey" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KP", label: "Korea, Democratic People's Republic Of" },
  { value: "KR", label: "Korea, Republic Of" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Lao People's Democratic Republic" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libyan Arab Jamahiriya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macau" },
  { value: "MK", label: "Macedonia, The Former Yugoslav Republic Of" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MQ", label: "Martinique" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "YT", label: "Mayotte" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia, Federated States Of" },
  { value: "MD", label: "Moldova, Republic Of" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MS", label: "Montserrat" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "AN", label: "Netherlands Antilles" },
  { value: "NC", label: "New Caledonia" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NU", label: "Niue" },
  { value: "NF", label: "Norfolk Island" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestinian Territory, Occupied" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PN", label: "Pitcairn" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QA", label: "Qatar" },
  { value: "RE", label: "Reunion" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russian Federation" },
  { value: "RW", label: "Rwanda" },
  { value: "SH", label: "Saint Helena" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "PM", label: "Saint Pierre and Miquelon" },
  { value: "VC", label: "Saint Vincent and The Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "GS", label: "South Georgia and The South Sandwich Islands" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SJ", label: "Svalbard and Jan Mayen" },
  { value: "SZ", label: "Swaziland" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syrian Arab Republic" },
  { value: "TW", label: "Taiwan, Province Of China" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania, United Republic Of" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TK", label: "Tokelau" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TC", label: "Turks and Caicos Islands" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UM", label: "United States Minor Outlying Islands" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "VI", label: "Virgin Islands, U.S." },
  { value: "WF", label: "Wallis and Futuna" },
  { value: "EH", label: "Western Sahara" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

export const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Federal Capital Territory (FCT)",
];

export function splitPhoneNumber(phoneNumber: string) {
  if (!phoneNumber.startsWith("+") || phoneNumber.length < 5) {
    return { countryCode: "", number: "" };
  }
  const countryCode = phoneNumber.substring(1, 4);
  const number = phoneNumber.substring(4);
  return { countryCode, number };
}

export const variantValue = {
  shirts: [
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
    "XXXXL",
    "XXXXXL",
    "XXXXXXL",
  ],
  shoes: [
    "EU 35-35.5",
    "EU 36-37",
    "EU 38-38.5",
    "EU 39-40",
    "EU 41-42",
    "UK 3.5",
    "UK 4",
    "UK 5",
    "UK 6",
    "UK 7",
    "US 5-5.5",
    "US 6-6.5",
    "US 7-7.5",
    "US 8-8.5",
    "US 9-9.5",
    "AU 5-5.5",
    "AU 6-6.5",
    "AU 7-7.5",
    "AU 8-8.5",
    "AU 9-9.5",
  ],
  drink: [
    "12 bottle",
    "10 bottles",
    "12 bottles(1 carton)",
    "12 cans",
    "12 pieces (1 pack)",
    "12 sticks(1 pack)",
    "180ml x 48 bottles(1 carton)",
    "18 bottles",
    "1.8L",
    "1 Bottle",
    "1 carton",
    "1 piece",
    "1 stick",
    "24 bottles",
    "24 cans",
    "24 pieces(1 pack)",
    "2 bottles",
    "2 packs",
    "375ml x24 Bottles(1 Carton)",
    "48 Bottles(1 Carton)",
    "4 Bottles",
    "4 Bottles(1 pack)",
    "4L",
    "6 Bottles",
    "6 Bottles(1 carton)",
    "6 cans",
    "750ml (1 Bottle)",
    "750ml x12 (1 Carton)",
    "8 bottles",
    "90ml x96 Bottles (1 carton)",
    "1 Pack",
    "6 Pack",
    "12 Pack",
    "5 Pack",
    "20 Pack",
    "18 pieces (1 Pack)",
    "20cl x 3",
    "20cl",
    "1L",
    "250ml",
    "33cl",
    "90cl",
    "900ml",
    "500ml",
    "1.5L",
    "25 pieces(1 pack)",
  ],
  volume: [
    "100ml",
    "200ml",
    "10ml",
    "2.5ml",
    "500ml",
    "110ml",
    "115ml",
    "125ml",
    "150ml",
    "130ml",
    "135ml",
    "1.5ml",
    "15ml",
    "140ml",
    "160ml",
    "170ml",
    "175ml",
    "180ml",
    "185ml",
    "11ml",
    "200ml",
    "250ml",
    "1ml",
    "20ml",
    "25ml",
    "300ml",
    "30ml",
    "40ml",
    "50ml",
    "5ml",
    "60ml",
    "6ml",
    "75ml",
    "80ml",
    "88ml",
    "85ml",
    "90ml",
    "95ml",
    "9ml",
    "120ml",
    "236ml",
    "2ml",
    "104ml",
    "7ml",
    "65ml",
    "600ml",
    "8ml",
    "3ml",
    "400ml",
    "450ml",
    "35ml",
    "550ml",
    "24ml",
    "380ml",
    "210ml",
    "70ml",
    "28ml",
    "240ml",
    "55ml",
    "2.5ml",
    "220ml",
    "45ml",
  ],
};

export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) return newValue === 0 ? 0 : 100; // Handle division by zero
  const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  return change;
};

export const formatPercentage = (
  value: number,
  decimals: number = 2,
  includeSign: boolean = false
): string => {
  const formatted = value.toFixed(decimals);
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${formatted}%`;
};

export const isSaleActive = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): boolean => {
  if (!startDate || !endDate) return false;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
};

export const COLOR_FAMILIES = [
  // Neutrals (10)
  "Black",
  "White",
  "Gray",
  "Silver",
  "Charcoal",
  "Off-White",
  "Ivory",
  "Pewter",
  "Slate",
  "Ash",

  // Reds & Pinks (10)
  "Red",
  "Crimson",
  "Burgundy",
  "Maroon",
  "Rose",
  "Pink",
  "Hot Pink",
  "Blush",
  "Fuchsia",
  "Salmon",

  // Blues (10)
  "Blue",
  "Navy",
  "Royal Blue",
  "Sky Blue",
  "Teal",
  "Azure",
  "Cyan",
  "Indigo",
  "Baby Blue",
  "Turquoise",

  // Greens (10)
  "Green",
  "Olive",
  "Emerald",
  "Mint",
  "Forest Green",
  "Lime",
  "Sage",
  "Khaki",
  "Jade",
  "Seafoam",

  // Yellows & Oranges (10)
  "Yellow",
  "Gold",
  "Lemon",
  "Mustard",
  "Amber",
  "Orange",
  "Coral",
  "Peach",
  "Tangerine",
  "Apricot",

  // Purples (10)
  "Purple",
  "Lavender",
  "Violet",
  "Plum",
  "Magenta",
  "Orchid",
  "Mauve",
  "Lilac",
  "Grape",
  "Eggplant",

  // Browns & Tans (10)
  "Brown",
  "Beige",
  "Tan",
  "Camel",
  "Bronze",
  "Coffee",
  "Chocolate",
  "Cream",
  "Nude",
  "Sand",

  // Earth Tones & Wood (10)
  "Terracotta",
  "Rust",
  "Ochre",
  "Mahogany",
  "Oak",
  "Walnut",
  "Clay",
  "Copper",
  "Brick",
  "Sienna",

  // Metallics & Gems (10)
  "Champagne",
  "Platinum",
  "Rose Gold",
  "Ruby",
  "Sapphire",
  "Pearl",
  "Iridescent",
  "Gunmetal",
  "Brass",
  "Chrome",

  // Specialized & Trends (10)
  "Neon Green",
  "Neon Orange",
  "Neon Pink",
  "Multicolor",
  "Transparent",
  "Clear",
  "Marble",
  "Denim",
  "Camo",
  "Animal Print",
] as const;

export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export function resolveDeliveryCategory(
  items: {
    weightKg: number;
  }[]
) {
  return items.some((i) => i.weightKg > 15)
    ? "LARGE"
    : items.some((i) => i.weightKg > 5)
    ? "MEDIUM"
    : "SMALL";
}
