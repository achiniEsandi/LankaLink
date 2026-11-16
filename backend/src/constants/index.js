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

// Starting prices in LKR (Business Plan, Annex I and III)
export const SERVICE_PRICES = {
  property_inspection: 3000,
  house_cleaning: 3500,
  garden_maintenance: 4000,
  minor_repairs: 2000,
  pet_care: 3500,
  family_welfare_visit: 5000,
  errand_assistance: 2000,
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

// Verification documents; certificates are optional and may be uploaded more than once
export const DOCUMENT_TYPES = {
  nic_front: { label: 'NIC (front)', required: true, multiple: false },
  nic_back: { label: 'NIC (back)', required: true, multiple: false },
  police_report: { label: 'Police clearance report', required: true, multiple: false },
  certificate: { label: 'Certificate or qualification', required: false, multiple: true },
};

export const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'];

// Weekly availability, used by booking matching
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const PERIODS = {
  morning: '8 am to 12 pm',
  afternoon: '12 pm to 4 pm',
  evening: '4 pm to 8 pm',
};

export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Booking lifecycle agreed in the team doc; checked_in/completed get GPS and photo proof from Ahmed's module
export const BOOKING_STATUSES = ['requested', 'assigned', 'accepted', 'checked_in', 'completed', 'confirmed', 'cancelled'];
// Statuses that occupy a provider's time slot
export const ACTIVE_BOOKING_STATUSES = ['assigned', 'accepted', 'checked_in'];
export const RECURRING_FREQUENCIES = { weekly: 7, fortnightly: 14, monthly: 28 };
export const BOOKING_MAX_DAYS_AHEAD = 60;
// How long an assigned provider has to accept before the job moves to the next match
export const ASSIGNMENT_RESPONSE_HOURS = 24;

// A provider is flagged for review when their average falls below this with enough reviews
export const LOW_RATING_THRESHOLD = 3;
export const LOW_RATING_MIN_REVIEWS = 3;

export const REQUIRED_DOCUMENT_TYPES = Object.entries(DOCUMENT_TYPES)
  .filter(([, t]) => t.required)
  .map(([type]) => type);

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_CERTIFICATES = 5;
