export const ROLES = ['customer', 'provider', 'admin'];

// Services offered through the platform (Business Plan, Product / Service Mix)
export const SERVICE_TYPES = [
  'property_inspection',
  'house_cleaning',
  'garden_maintenance',
  'minor_repairs',
  'pet_care',
  'family_welfare_visit',
  'errand_assistance',
];

export const SERVICE_LABELS = {
  property_inspection: 'Property inspection',
  house_cleaning: 'House cleaning',
  garden_maintenance: 'Garden maintenance',
  minor_repairs: 'Minor repairs',
  pet_care: 'Pet care',
  family_welfare_visit: 'Family welfare visits',
  errand_assistance: 'Errands',
};

// Shown to providers while they choose what they offer
export const SERVICE_DESCRIPTIONS = {
  property_inspection: 'Check empty houses for leaks, damage or break-ins and send photos',
  house_cleaning: 'Sweep, mop, dust and tidy homes, one-off or regularly',
  garden_maintenance: 'Cut grass, trim plants, clear leaves and water the garden',
  minor_repairs: 'Fix taps, switches, doors and other small jobs around the house',
  pet_care: 'Feed, walk and look after pets while owners are away',
  family_welfare_visit: 'Visit elderly parents, keep them company and report back (non-medical)',
  errand_assistance: 'Buy groceries, pay bills, collect medicine or documents',
};

export const PROVINCES = {
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Southern: ['Galle', 'Matara', 'Hambantota'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Uva: ['Badulla', 'Monaragala'],
  Sabaragamuwa: ['Kegalle', 'Ratnapura'],
};

export const DISTRICTS = Object.values(PROVINCES).flat().sort();

// Initial operating area (Business Plan, section 4)
export const LAUNCH_DISTRICTS = ['Colombo', 'Gampaha'];

export const PROVIDER_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

// Indicative starting prices in LKR (Business Plan: Rs 2,000 to 5,000 per service).
// Final per-service prices still to be confirmed by the team.
export const SERVICE_PRICES = {
  property_inspection: 2500,
  house_cleaning: 3500,
  garden_maintenance: 3000,
  minor_repairs: 4000,
  pet_care: 2000,
  family_welfare_visit: 3000,
  errand_assistance: 2000,
};

// Monthly packages (Business Plan: Rs 10,000 and Rs 45,000 a month)
export const PACKAGES = [
  {
    key: 'home_care',
    name: 'Home care',
    pricePerMonth: 10000,
    description: 'Regular checks that keep an empty house safe and tidy',
    includes: ['property_inspection', 'house_cleaning', 'garden_maintenance'],
  },
  {
    key: 'family_and_home',
    name: 'Family and home',
    pricePerMonth: 45000,
    description: 'Frequent visits to elderly family plus full care of the house',
    includes: SERVICE_TYPES,
  },
];

// Customers live abroad, so they choose the language we contact them in
export const LANGUAGES = ['en', 'si', 'ta'];
export const LANGUAGE_LABELS = { en: 'English', si: 'සිංහල (Sinhala)', ta: 'தமிழ் (Tamil)' };

export const PROPERTY_TYPES = ['house', 'apartment', 'annex', 'land', 'commercial', 'other'];
export const PROPERTY_TYPE_LABELS = {
  house: 'House',
  apartment: 'Apartment',
  annex: 'Annex',
  land: 'Land only',
  commercial: 'Shop or office',
  other: 'Other',
};

export const RELATIONSHIPS = [
  'mother',
  'father',
  'grandmother',
  'grandfather',
  'sibling',
  'aunt_uncle',
  'spouse',
  'child',
  'other',
];
export const RELATIONSHIP_LABELS = {
  mother: 'Mother',
  father: 'Father',
  grandmother: 'Grandmother',
  grandfather: 'Grandfather',
  sibling: 'Brother or sister',
  aunt_uncle: 'Aunt or uncle',
  spouse: 'Husband or wife',
  child: 'Son or daughter',
  other: 'Other',
};

// Rough bounding box of Sri Lanka, used to catch swapped or mistyped coordinates
export const SRI_LANKA_BOUNDS = { minLat: 5.8, maxLat: 9.9, minLng: 79.4, maxLng: 81.95 };

// ISO 3166-1 alpha-2 codes; names come from Intl so they never need maintaining here
export const COUNTRY_CODES = `AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS
BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM
FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE
KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV
MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC
SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC
VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/);
