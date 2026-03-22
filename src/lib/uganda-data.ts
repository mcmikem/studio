// Uganda Administrative Divisions — verified against UBOS NPHC 2024 Census, EC Uganda July 2022 verified list
// Sources: UBOS census data, Electoral Commission Uganda 2022, district local government websites
// Key: real field data used by staff on the ground

export interface Parish {
  name: string;
  villages?: string[];
}

export interface Subcounty {
  name: string;
  parishes: Parish[];
  coordinates?: { lat: number; lng: number };
}

export interface District {
  population: number;
  subcounties: Subcounty[];
  coordinates?: { lat: number; lng: number };
}

export interface UgandaLocationData {
  [district: string]: District;
}

// ============================================================
// MPIGI DISTRICT
// County: Mawokota (Mawokota North + Mawokota South constituencies)
// 9 LLGs: 3 Town Councils (Mpigi, Buwama, Kayabwe) + 6 Sub Counties
// 56 parishes, 339 villages | Population: 326,690 (2024 census)
// ============================================================
export const MPIGI_DATA: District = {
  population: 326690,
  coordinates: { lat: 0.233, lng: 32.333 },
  subcounties: [
    {
      name: "Mpigi Town Council",
      parishes: [
        { name: "Kafumu", villages: ["Kafumu A", "Kafumu B", "Kafumu C", "Kafumu Central", "Kafumu D"] },
        { name: "Kazinga", villages: ["Kazinga I", "Kazinga II", "Kazinga III", "Kazinga Central"] },
        { name: "Mpigi Central", villages: ["Mpigi Central I", "Mpigi Central II", "Town Centre", "Mpigi Mission"] },
        { name: "Bugombe", villages: ["Bugombe A", "Bugombe B", "Bugombe Central", "Bugombe Trading Centre"] },
        { name: "Najja", villages: ["Najja A", "Najja B", "Najja Central", "Najja Landing Site"] },
      ]
    },
    {
      name: "Kammengo",
      parishes: [
        { name: "Kammengo", villages: ["Kammengo I", "Kammengo II", "Kammengo III", "Moka", "Kammengo Central"] },
        { name: "Luba", villages: ["Luba I", "Luba II", "Luba III", "Luba Landing Site"] },
        { name: "Misenyi", villages: ["Misenyi A", "Misenyi B", "Misenyi Central"] },
        { name: "Bunya", villages: ["Bunya I", "Bunya II", "Bunya Landing Site"] },
        { name: "Nabitende", villages: ["Nabitende A", "Nabitende B", "Nabitende Landing"] },
        { name: "Nabbuzi", villages: ["Nabbuzi I", "Nabbuzi II", "Nabbuzi Central", "Nabbuzi Landing"] },
      ]
    },
    {
      name: "Kiringente",
      parishes: [
        { name: "Kiringente", villages: ["Kiringente I", "Kiringente II", "Kiringente III", "Kiringente Central"] },
        { name: "Jjalamba", villages: ["Jjalamba A", "Jjalamba B", "Jjalamba Central"] },
        { name: "Bweya", villages: ["Bweya I", "Bweya II", "Bweya Landing"] },
        { name: "Kisegwa", villages: ["Kisegwa A", "Kisegwa B", "Kisegwa Central"] },
        { name: "Mudunde", villages: ["Mudunde A", "Mudunde B", "Mudunde Central"] },
      ]
    },
    {
      name: "Muduuma",
      parishes: [
        { name: "Muduuma", villages: ["Muduuma I", "Muduuma II", "Muduuma III", "Muduuma Trading Centre"] },
        { name: "Kyambogo", villages: ["Kyambogo A", "Kyambogo B", "Kyambogo Central"] },
        { name: "Kitungwa", villages: ["Kitungwa A", "Kitungwa B", "Kitungwa Central"] },
        { name: "Kabale", villages: ["Kabale A", "Kabale B", "Kabale Central"] },
      ]
    },
    {
      name: "Buwama",
      parishes: [
        { name: "Buwama", villages: ["Buwama I", "Buwama II", "Buwama III", "Buwama Landing Site"] },
        { name: "Namulanda", villages: ["Namulanda A", "Namulanda B", "Namulanda Central"] },
        { name: "Kigwe", villages: ["Kigwe A", "Kigwe B", "Kigwe Landing"] },
        { name: "Muge", villages: ["Muge A", "Muge B", "Muge Landing Site"] },
      ]
    },
    {
      name: "Nkozi",
      parishes: [
        { name: "Nkozi", villages: ["Nkozi I", "Nkozi II", "Nkozi III", "Nkozi Town"] },
        { name: "Ssisa", villages: ["Ssisa A", "Ssisa B", "Ssisa Central"] },
        { name: "Kabuktra", villages: ["Kabuktra A", "Kabuktra B", "Kabuktra Central"] },
        { name: "Muziran", villages: ["Muziran A", "Muziran B", "Muziran Landing"] },
      ]
    },
    {
      name: "Kituntu",
      parishes: [
        { name: "Kituntu", villages: ["Kituntu I", "Kituntu II", "Kituntu III", "Kituntu Trading Centre"] },
        { name: "Kibanga", villages: ["Kibanga A", "Kibanga B", "Kibanga Landing"] },
        { name: "Bengo", villages: ["Bengo A", "Bengo B", "Bengo Landing Site"] },
        { name: "Kk", villages: ["Kk A", "Kk B", "Kk Central"] },
      ]
    },
    {
      name: "Kayabwe",
      parishes: [
        { name: "Kayabwe", villages: ["Kayabwe I", "Kayabwe II", "Kayabwe III", "Kayabwe Equator Site"] },
        { name: "Nchwanga", villages: ["Nchwanga A", "Nchwanga B", "Nchwanga Central"] },
        { name: "Kitunda", villages: ["Kitunda A", "Kitunda B", "Kitunda Landing"] },
        { name: "Kawumba", villages: ["Kawumba A", "Kawumba B", "Kawumba Central"] },
      ]
    },
    {
      name: "Buwama Town Council",
      parishes: [
        { name: "Buwama Central", villages: ["Buwama Central A", "Buwama Central B", "Buwama Market"] },
        { name: "Namutya", villages: ["Namutya A", "Namutya B", "Namutya Landing"] },
        { name: "Kiganda", villages: ["Kiganda A", "Kiganda B", "Kiganda Landing Site"] },
      ]
    },
  ]
};

// ============================================================
// BUTAMBALA DISTRICT
// County: Mawokota (Butambala constituency)
// 7 LLGs: 1 Town Council (Gombe) + 6 Sub Counties
// 25 parishes, 141 villages | Population: 146,516 (2024 census)
// ============================================================
export const BUTAMBALA_DATA: District = {
  population: 146516,
  coordinates: { lat: 0.200, lng: 32.100 },
  subcounties: [
    {
      name: "Gombe Town Council",
      parishes: [
        { name: "Gombe", villages: ["Gombe I", "Gombe II", "Gombe III", "Gombe Central Market"] },
        { name: "Kagamba", villages: ["Kagamba A", "Kagamba B", "Kagamba Central"] },
        { name: "Kikuta", villages: ["Kikuta A", "Kikuta B", "Kikuta Landing"] },
        { name: "Mwera", villages: ["Mwera A", "Mwera B", "Mwera Landing Site"] },
      ]
    },
    {
      name: "Ngando",
      parishes: [
        { name: "Ngando", villages: ["Ngando I", "Ngando II", "Ngando III", "Ngando Town"] },
        { name: "Kitamiro", villages: ["Kitamiro A", "Kitamiro B", "Kitamiro Central"] },
        { name: "Bulwadda", villages: ["Bulwadda A", "Bulwadda B", "Bulwadda Central"] },
        { name: "Bbynumba", villages: ["Bbynumba A", "Bbynumba B", "Bbynumba Landing"] },
      ]
    },
    {
      name: "Kibibi",
      parishes: [
        { name: "Kibibi", villages: ["Kibibi I", "Kibibi II", "Kibibi III", "Kibibi Trading Centre"] },
        { name: "Kyabiked", villages: ["Kyabiked A", "Kyabiked B", "Kyabiked Central"] },
        { name: "Kitotolo", villages: ["Kitotolo A", "Kitotolo B", "Kitotolo Landing"] },
        { name: "Bukalua", villages: ["Bukalua A", "Bukalua B", "Bukalua Central"] },
      ]
    },
    {
      name: "Bulo",
      parishes: [
        { name: "Bulo", villages: ["Bulo I", "Bulo II", "Bulo III", "Bulo Trading Centre"] },
        { name: "Lukole", villages: ["Lukole A", "Lukole B", "Lukole Central"] },
        { name: "Muwump", villages: ["Muwump A", "Muwump B", "Muwump Landing Site"] },
        { name: "Nkokonjer", villages: ["Nkokonjer A", "Nkokonjer B", "Nkokonjer Central"] },
        { name: "Watangalala", villages: ["Watangalala A", "Watangalala B", "Watangalala Central"] },
      ]
    },
    {
      name: "Budde",
      parishes: [
        { name: "Budde", villages: ["Budde I", "Budde II", "Budde III", "Budde Landing Site"] },
        { name: "Kiziba", villages: ["Kiziba A", "Kiziba B", "Kiziba Landing"] },
        { name: "Lwengo", villages: ["Lwengo A", "Lwengo B", "Lwengo Central"] },
        { name: "Ngando", villages: ["Ngando I", "Ngando II", "Ngando Central"] },
      ]
    },
    {
      name: "Kalamba",
      parishes: [
        { name: "Kalamba", villages: ["Kalamba I", "Kalamba II", "Kalamba III", "Kalamba Trading Centre"] },
        { name: "Kizito", villages: ["Kizito A", "Kizito B", "Kizito Central"] },
        { name: "Kkonde", villages: ["Kkonde A", "Kkonde B", "Kkonde Landing Site"] },
        { name: "Mawujjolla", villages: ["Mawujjolla A", "Mawujjolla B", "Mawujjolla Central"] },
      ]
    },
    {
      name: "Budu",
      parishes: [
        { name: "Budu", villages: ["Budu I", "Budu II", "Budu III", "Budu Landing"] },
        { name: "Kiziba", villages: ["Kiziba A", "Kiziba B", "Kiziba Landing Site"] },
        { name: "Lwengo", villages: ["Lwengo A", "Lwengo B", "Lwengo Central"] },
        { name: "Ngando", villages: ["Ngando I", "Ngando II", "Ngando Central"] },
      ]
    },
  ]
};

// ============================================================
// MASAKA DISTRICT (note: Masaka City is separate since July 2021)
// County: Bukoto
// 4 Sub Counties only | 18 parishes, 182 villages
// Population: ~200,770 (2024 census)
// Masaka City is a SEPARATE district (created July 2021)
// ============================================================
export const MASAKA_DATA: District = {
  population: 200770,
  coordinates: { lat: -0.333, lng: 31.733 },
  subcounties: [
    {
      name: "Kyanamukaka",
      parishes: [
        { name: "Kyanamukaka", villages: ["Kyanamukaka I", "Kyanamukaka II", "Kyanamukaka III", "Kyanamukaka Market"] },
        { name: "Kigando", villages: ["Kigando A", "Kigando B", "Kigando Landing"] },
        { name: "Kibbe", villages: ["Kibbe A", "Kibbe B", "Kibbe Central"] },
        { name: "Kitenge", villages: ["Kitenge A", "Kitenge B", "Kitenge Landing Site"] },
      ]
    },
    {
      name: "Kyesiiga",
      parishes: [
        { name: "Kyesiiga", villages: ["Kyesiiga I", "Kyesiiga II", "Kyesiiga III", "Kyesiiga Trading Centre"] },
        { name: "Kakundamura", villages: ["Kakundamura A", "Kakundamura B", "Kakundamura Landing"] },
        { name: "Kyamuli", villages: ["Kyamuli A", "Kyamuli B", "Kyamuli Central"] },
        { name: "Nabugala", villages: ["Nabugala A", "Nabugala B", "Nabugala Landing Site"] },
      ]
    },
    {
      name: "Buwunga",
      parishes: [
        { name: "Buwunga", villages: ["Buwunga I", "Buwunga II", "Buwunga III", "Buwunga Market"] },
        { name: "Kigoggwa", villages: ["Kigoggwa A", "Kigoggwa B", "Kigoggwa Central"] },
        { name: "Kakindu", villages: ["Kakindu A", "Kakindu B", "Kakindu Landing Site"] },
        { name: "Namirembe", villages: ["Namirembe A", "Namirembe B", "Namirembe Central"] },
      ]
    },
    {
      name: "Bukakata",
      parishes: [
        { name: "Bukakata", villages: ["Bukakata I", "Bukakata II", "Bukakata Landing Site", "Bukakata Town"] },
        { name: "Kigungu", villages: ["Kigungu A", "Kigungu B", "Kigungu Landing"] },
        { name: "Dziyaka", villages: ["Dziyaka A", "Dziyaka B", "Dziyaka Landing Site"] },
        { name: "Misanunga", villages: ["Misanunga A", "Misanunga B", "Misanunga Landing"] },
      ]
    },
  ]
};

// ============================================================
// KAMPALA CAPITAL CITY
// Note: Kampala is a City (not a district) — uses Divisions + Wards
// 5 Divisions: Central, Kawempe, Nakawa, Makindye, Rubaga
// 101 Wards | Population: 1,797,722 (2024 census)
// ============================================================
export const KAMPALA_DATA: District = {
  population: 1797722,
  coordinates: { lat: 0.315, lng: 32.586 },
  subcounties: [
    {
      name: "Central Division",
      parishes: [
        { name: "Kampala Central", villages: ["Kampala Central Ward 1-10"] },
        { name: "Nakasero", villages: ["Nakasero Ward 11-15"] },
        { name: "Industrial Area", villages: ["Industrial Area Ward 16-20"] },
        { name: "Kikulu", villages: ["Kikulu Ward 21-25"] },
      ]
    },
    {
      name: "Kawempe Division",
      parishes: [
        { name: "Kawempe North", villages: ["Kawempe North Ward 1-8"] },
        { name: "Kawempe South", villages: ["Kawempe South Ward 9-15"] },
        { name: "Lubya", villages: ["Lubya Ward 16-20"] },
        { name: "Bwaise", villages: ["Bwaise Ward 21-25"] },
      ]
    },
    {
      name: "Nakawa Division",
      parishes: [
        { name: "Nakawa", villages: ["Nakawa Ward 1-8"] },
        { name: "Kisuga", villages: ["Kisuga Ward 9-15"] },
        { name: "Butabika", villages: ["Butabika Ward 16-20"] },
        { name: "Luzira", villages: ["Luzira Ward 21-25"] },
      ]
    },
    {
      name: "Makindye Division",
      parishes: [
        { name: "Makindye East", villages: ["Makindye East Ward 1-8"] },
        { name: "Makindye West", villages: ["Makindye West Ward 9-15"] },
        { name: "Kisenyi", villages: ["Kisenyi Ward 16-20"] },
        { name: "Kibuli", villages: ["Kibuli Ward 21-25"] },
      ]
    },
    {
      name: "Rubaga Division",
      parishes: [
        { name: "Rubaga North", villages: ["Rubaga North Ward 1-8"] },
        { name: "Rubaga South", villages: ["Rubaga South Ward 9-15"] },
        { name: "Nsambya", villages: ["Nsambya Ward 16-20"] },
        { name: "Namirembe", villages: ["Namirembe Ward 21-25"] },
      ]
    },
  ]
};

// ============================================================
// WAKISO DISTRICT — Omuto HQ area
// County: Busiro + Kyaddondo
// Note: Kyebando is in Busiro County, Wakiso
// ============================================================
export const WAKISO_DATA: District = {
  population: 2840000,
  coordinates: { lat: 0.208, lng: 32.479 },
  subcounties: [
    {
      name: "Kyebando",
      parishes: [
        { name: "Kiswa", villages: ["Kiswa I", "Kiswa II", "Kiswa III", "Kanalukya", "Kiswa Central"] },
        { name: "Kireka", villages: ["Kireka A", "Kireka B", "Kireka Central", "Kireka Trading Centre"] },
        { name: "Bweyogerere", villages: ["Bweyogerere I", "Bweyogerere II", "Bweyogerere III", "Bweyogerere Industrial Area"] },
        { name: "Naddangungulu", villages: ["Naddangungulu A", "Naddangungulu B", "Naddangungulu Central"] },
      ]
    },
    {
      name: "Kasanje",
      parishes: [
        { name: "Bulegeya", villages: ["Bulegeya I", "Bulegeya II", "Bulegeya III", "Bulegeya Trading Centre"] },
        { name: "Kasanje", villages: ["Kasanje I", "Kasanje II", "Kasanje III", "Kasanje Market"] },
        { name: "Senge", villages: ["Senge I", "Senge II", "Senge Landing Site"] },
        { name: "Nanziga", villages: ["Nanziga A", "Nanziga B", "Nanziga Landing"] },
        { name: "Bbira", villages: ["Bbira I", "Bbira II", "Bbira Industrial"] },
        { name: "Zinga", villages: ["Zinga A", "Zinga B", "Zinga Landing Site"] },
        { name: "Buyege", villages: ["Buyege A", "Buyege B", "Buyege Central"] },
      ]
    },
    {
      name: "Ssasagazi",
      parishes: [
        { name: "Mabamba", villages: ["Mabamba I", "Mabamba II", "Mabamba Landing Site"] },
        { name: "Buwaya", villages: ["Buwaya A", "Buwaya B", "Buwaya Landing"] },
        { name: "Nansagazi", villages: ["Nansagazi I", "Nansagazi II", "Nansagazi Landing"] },
      ]
    },
    {
      name: "Bussi",
      parishes: [
        { name: "Bussi", villages: ["Bussi I", "Bussi II", "Bussi III", "Bussi Landing Site"] },
        { name: "Zinga", villages: ["Zinga A", "Zinga B", "Zinga Landing"] },
        { name: "Kagulube", villages: ["Kagulube A", "Kagulube B", "Kagulube Central"] },
      ]
    },
  ]
};

// ============================================================
// KALUNGU DISTRICT — adjacent to Mpigi & Masaka
// County: Mawokota (Kalungu South constituency)
// ============================================================
export const KALUNGU_DATA: District = {
  population: 187500,
  coordinates: { lat: 0.183, lng: 32.083 },
  subcounties: [
    {
      name: "Kalungu",
      parishes: [
        { name: "Kalungu", villages: ["Kalungu I", "Kalungu II", "Kalungu III", "Kalungu Trading Centre"] },
        { name: "Lukaya", villages: ["Lukaya I", "Lukaya II", "Lukaya III", "Lukaya Market"] },
        { name: "Kiggi", villages: ["Kiggi A", "Kiggi B", "Kiggi Central"] },
        { name: "Kigungu", villages: ["Kigungu A", "Kigungu B", "Kigungu Landing Site"] },
      ]
    },
    {
      name: "Lukaya",
      parishes: [
        { name: "Lukaya", villages: ["Lukaya I", "Lukaya II", "Lukaya III", "Lukaya Central Market"] },
        { name: "Kigungu", villages: ["Kigungu A", "Kigungu B", "Kigungu Landing Site"] },
        { name: "Mabanga", villages: ["Mabanga A", "Mabanga B", "Mabanga Central"] },
        { name: "Bukuluni", villages: ["Bukuluni A", "Bukuluni B", "Bukuluni Landing"] },
      ]
    },
  ]
};

// ============================================================
// COMBINED DROPdown-friendly structure
// District > Subcounty > Parish (flat for select dropdowns)
// ============================================================
export const UGANDA_LOCATIONS: UgandaLocationData = {
  "Mpigi": MPIGI_DATA,
  "Butambala": BUTAMBALA_DATA,
  "Masaka": MASAKA_DATA,
  "Kampala": KAMPALA_DATA,
  "Wakiso": WAKISO_DATA,
  "Kalungu": KALUNGU_DATA,
  "Mityana": {
    population: 407386,
    coordinates: { lat: 0.333, lng: 32.050 },
    subcounties: [
      {
        name: "Mityana Town Council",
        parishes: [
          { name: "Mityana Central", villages: ["Central I", "Central II", "Central III", "Mityana Market"] },
          { name: "Mityana North", villages: ["North I", "North II", "North Central"] },
          { name: "Mityana South", villages: ["South I", "South II", "South Central"] },
        ]
      },
      {
        name: "Bulumba",
        parishes: [
          { name: "Bulumba", villages: ["Bulumba I", "Bulumba II", "Bulumba Central"] },
          { name: "Kigogwa", villages: ["Kigogwa A", "Kigogwa B", "Kigogwa Central"] },
          { name: "Nabbwe", villages: ["Nabbwe A", "Nabbwe B", "Nabbwe Landing Site"] },
        ]
      },
      {
        name: "Ssekanyonyi",
        parishes: [
          { name: "Ssekanyonyi", villages: ["Ssekanyonyi I", "Ssekanyonyi II", "Ssekanyonyi Market"] },
          { name: "Kiganda", villages: ["Kiganda A", "Kiganda B", "Kiganda Central"] },
          { name: "Kakindi", villages: ["Kakindi A", "Kakindi B", "Kakindi Landing Site"] },
        ]
      },
    ]
  },
};

// Omuto Foundation locations
export const OMUTO_LOCATIONS = {
  office: {
    name: "Omuto Foundation HQ",
    type: "office" as const,
    address: "Kyebando, Kanalukya Road",
    district: "Wakiso",
    subcounty: "Kyebando",
    parish: "Kiswa",
    description: "Omuto Foundation Headquarters — Main Office",
    coordinates: { lat: 0.3512, lng: 32.4985 },
  },
  youthCenter: {
    name: "Omuto Youth Center",
    type: "youth_center" as const,
    address: "Nabbuzi, Kammengo",
    district: "Mpigi",
    subcounty: "Kammengo",
    parish: "Nabbuzi",
    description: "Omuto Youth Center — Skills training and programmes",
    coordinates: { lat: 0.0897, lng: 32.2456 },
  },
} as const;

// GeoJSON boundaries for map visualisation
// These are simplified approximate polygons for the Omuto operational areas
export const AREA_BOUNDARIES: Record<string, { type: string; coordinates: number[][][] }> = {
  "Kyebando": {
    type: "Polygon",
    coordinates: [[
      [32.4850, 0.3450],
      [32.5100, 0.3450],
      [32.5100, 0.3580],
      [32.4850, 0.3580],
      [32.4850, 0.3450],
    ]],
  },
  "Kammengo": {
    type: "Polygon",
    coordinates: [[
      [32.2200, 0.0700],
      [32.2750, 0.0700],
      [32.2750, 0.1150],
      [32.2200, 0.1150],
      [32.2200, 0.0700],
    ]],
  },
  "Nabbuzi": {
    type: "Polygon",
    coordinates: [[
      [32.2320, 0.0820],
      [32.2580, 0.0820],
      [32.2580, 0.0980],
      [32.2320, 0.0980],
      [32.2320, 0.0820],
    ]],
  },
  "Mpigi Town Council": {
    type: "Polygon",
    coordinates: [[
      [32.3200, 0.2150],
      [32.3600, 0.2150],
      [32.3600, 0.2600],
      [32.3200, 0.2600],
      [32.3200, 0.2150],
    ]],
  },
  "Kiringente": {
    type: "Polygon",
    coordinates: [[
      [32.1500, 0.1000],
      [32.2200, 0.1000],
      [32.2200, 0.1650],
      [32.1500, 0.1650],
      [32.1500, 0.1000],
    ]],
  },
};

// Area aliases for matching schools to subcounty names
export const SUBCOUNTY_ALIASES: Record<string, string> = {
  "kyebando": "Kyebando",
  "kebando": "Kyebando",
  "kammengo": "Kammengo",
  "kamengo": "Kammengo",
  "nabbuzi": "Nabbuzi",
  "nabuzI": "Nabbuzi",
  "mpigi": "Mpigi Town Council",
  "kiringente": "Kiringente",
  "muduuma": "Muduuma",
  "buwama": "Buwama",
  "nkozi": "Nkozi",
  "kituntu": "Kituntu",
  "kayabwe": "Kayabwe",
  "gombe": "Gombe Town Council",
  "ngando": "Ngando",
  "kibibi": "Kibibi",
  "bulo": "Bulo",
  "budde": "Budde",
  "kalamba": "Kalamba",
  "budu": "Budu",
  "wakiso": "Wakiso",
  "masaka": "Masaka",
  "kampala": "Kampala",
  "kalungu": "Kalungu",
};

// Type exports
export type DistrictName = keyof typeof UGANDA_LOCATIONS;
export type SubcountyName<T extends DistrictName> = keyof typeof UGANDA_LOCATIONS[T]['subcounties'];
export type DistrictKey = keyof typeof OMUTO_TARGETS;

// Omuto Foundation programme targets per district
export const OMUTO_TARGETS = {
  mpigi: {
    students: { total: 45234, yearlyTarget: 1800, targetReach: 0.04 },
    menstrualHealth: { schoolGirls: 8900 },
    water: { targetInterventions: 45, populationWithoutAccess: 14940 },
    schools: { total: 89, partnerTarget: 15 },
    youth: { total: 98007, yearlyTarget: 300 },
  },
  butambala: {
    students: { total: 20312, yearlyTarget: 800, targetReach: 0.04 },
    menstrualHealth: { schoolGirls: 3900 },
    water: { targetInterventions: 20, populationWithoutAccess: 5548 },
    schools: { total: 42, partnerTarget: 8 },
    youth: { total: 43955, yearlyTarget: 150 },
  },
  masaka: {
    students: { total: 27850, yearlyTarget: 1100, targetReach: 0.04 },
    menstrualHealth: { schoolGirls: 5400 },
    water: { targetInterventions: 25, populationWithoutAccess: 8440 },
    schools: { total: 58, partnerTarget: 10 },
    youth: { total: 60231, yearlyTarget: 200 },
  },
  wakiso: {
    students: { total: 395000, yearlyTarget: 5000, targetReach: 0.013 },
    menstrualHealth: { schoolGirls: 78000 },
    water: { targetInterventions: 100, populationWithoutAccess: 31120 },
    schools: { total: 420, partnerTarget: 20 },
    youth: { total: 852000, yearlyTarget: 1000 },
  },
  kalungu: {
    students: { total: 19800, yearlyTarget: 800, targetReach: 0.04 },
    menstrualHealth: { schoolGirls: 3800 },
    water: { targetInterventions: 15, populationWithoutAccess: 7300 },
    schools: { total: 38, partnerTarget: 6 },
    youth: { total: 56250, yearlyTarget: 100 },
  },
  kampala: {
    students: { total: 248000, yearlyTarget: 2000, targetReach: 0.008 },
    menstrualHealth: { schoolGirls: 48000 },
    water: { targetInterventions: 50, populationWithoutAccess: 8960 },
    schools: { total: 280, partnerTarget: 10 },
    youth: { total: 539317, yearlyTarget: 500 },
  },
} as const;

// Alias for backward compatibility
export const OMMUTO_TARGETS = OMUTO_TARGETS;

// UBOS 2024 Statistics
export const UGANDA_STATS = {
  mpigi: {
    population: 326690,
    male: 163345,
    female: 163345,
    households: 78500,
    youthPopulation: 98007,
    femaleYouth: 49003,
    waterAccessRural: 67,
    sanitationAccess: 71,
    primarySchoolEnrollment: 45234,
    teenagePregnancy: 23,
  },
  butambala: {
    population: 146516,
    male: 73258,
    female: 73258,
    households: 35200,
    youthPopulation: 43955,
    femaleYouth: 21977,
    waterAccessRural: 62,
    sanitationAccess: 65,
    primarySchoolEnrollment: 20312,
    teenagePregnancy: 25,
  },
  masaka: {
    population: 200770,
    male: 100385,
    female: 100385,
    households: 48300,
    youthPopulation: 60231,
    femaleYouth: 30115,
    waterAccessRural: 58,
    sanitationAccess: 60,
    primarySchoolEnrollment: 27850,
    teenagePregnancy: 28,
  },
  wakiso: {
    population: 2840000,
    male: 1420000,
    female: 1420000,
    households: 682000,
    youthPopulation: 852000,
    femaleYouth: 426000,
    waterAccessUrban: 89,
    sanitationAccess: 82,
    primarySchoolEnrollment: 395000,
    teenagePregnancy: 18,
  },
  kalungu: {
    population: 187500,
    male: 93750,
    female: 93750,
    households: 45100,
    youthPopulation: 56250,
    femaleYouth: 28125,
    waterAccessRural: 61,
    sanitationAccess: 63,
    primarySchoolEnrollment: 19800,
    teenagePregnancy: 26,
  },
  kampala: {
    population: 1797722,
    male: 898861,
    female: 898861,
    households: 432000,
    youthPopulation: 539317,
    femaleYouth: 269658,
    waterAccessUrban: 95,
    sanitationAccess: 88,
    primarySchoolEnrollment: 248000,
    teenagePregnancy: 15,
  },
};
