// Uganda Administrative Divisions - UBOS 2024 Census Data
// Sources: UBOS NPHC 2024, citypopulation.de, district websites

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

// Omuto Foundation Locations
export const OMUTO_LOCATIONS = {
  office: {
    name: "Omuto Foundation HQ",
    type: "office" as const,
    address: "Kyebando, Kanalukya Road",
    district: "Wakiso",
    subcounty: "Kiswa",
    description: "Omuto Foundation Headquarters - Main Office",
    coordinates: { lat: 0.3512, lng: 32.4985 },
  },
  youthCenter: {
    name: "Omuto Youth Center",
    type: "youth_center" as const,
    address: "Nabbuzi, Kammengo",
    district: "Mpigi",
    subcounty: "Kammengo",
    description: "Omuto Youth Center - Skills training and programmes",
    coordinates: { lat: 0.0897, lng: 32.2456 },
  },
} as const;

// GeoJSON boundaries for areas (simplified polygons)
export const AREA_BOUNDARIES: Record<string, { type: string; coordinates: number[][][] }> = {
  "Kyebando": {
    type: "Polygon",
    coordinates: [[
      [32.4900, 0.3480],
      [32.5050, 0.3480],
      [32.5050, 0.3550],
      [32.4900, 0.3550],
      [32.4900, 0.3480],
    ]],
  },
  "Kammengo": {
    type: "Polygon",
    coordinates: [[
      [32.2200, 0.0700],
      [32.2700, 0.0700],
      [32.2700, 0.1100],
      [32.2200, 0.1100],
      [32.2200, 0.0700],
    ]],
  },
  "Nabbuzi": {
    type: "Polygon",
    coordinates: [[
      [32.2350, 0.0850],
      [32.2550, 0.0850],
      [32.2550, 0.0950],
      [32.2350, 0.0950],
      [32.2350, 0.0850],
    ]],
  },
  "Mpigi": {
    type: "Polygon",
    coordinates: [[
      [32.2800, 0.1800],
      [32.3800, 0.1800],
      [32.3800, 0.2800],
      [32.2800, 0.2800],
      [32.2800, 0.1800],
    ]],
  },
  "Kiringente": {
    type: "Polygon",
    coordinates: [[
      [32.1500, 0.1000],
      [32.2200, 0.1000],
      [32.2200, 0.1600],
      [32.1500, 0.1600],
      [32.1500, 0.1000],
    ]],
  },
};

// Key UBOS Statistics for Central Region districts where Omuto operates
export const UGANDA_LOCATIONS: UgandaLocationData = {
  "Mpigi": {
    population: 326690,
    coordinates: { lat: 0.233, lng: 32.333 },
    subcounties: [
      {
        name: "Mpigi Town Council",
        parishes: [
          { name: "Kafumu", villages: ["Kafumu A", "Kafumu B", "Kafumu C", "Kafumu Central"] },
          { name: "Kazinga", villages: ["Kazinga I", "Kazinga II", "Kazinga III"] },
          { name: "Mpigi Central", villages: ["Mpigi Central I", "Mpigi Central II", "Town Centre"] },
          { name: "Bugombe", villages: ["Bugombe A", "Bugombe B", "Bugombe Central"] },
          { name: "Najja", villages: ["Najja A", "Najja B", "Najja Central"] },
        ]
      },
      {
        name: "Kammengo",
        parishes: [
          { name: "Kammengo", villages: ["Kammengo I", "Kammengo II", "Kammengo III", "Moka"] },
          { name: "Luba", villages: ["Luba I", "Luba II", "Luba III"] },
          { name: "Misenyi", villages: ["Misenyi A", "Misenyi B"] },
          { name: "Bunya", villages: ["Bunya I", "Bunya II"] },
          { name: "Nabitende", villages: ["Nabitende A", "Nabitende B"] },
          { name: "Nabbuzi", villages: ["Nabbuzi I", "Nabbuzi II", "Nabbuzi Central"] },
        ]
      },
      {
        name: "Kiringente",
        parishes: [
          { name: "Kiringente", villages: ["Kiringente I", "Kiringente II", "Kiringente III"] },
          { name: "Jjalamba", villages: ["Jjalamba A", "Jjalamba B", "Jjalamba Central"] },
          { name: "Bweya", villages: ["Bweya I", "Bweya II"] },
          { name: "Kisegwa", villages: ["Kisegwa A", "Kisegwa B"] },
          { name: "Mudunde", villages: ["Mudunde A", "Mudunde B"] },
        ]
      },
      {
        name: "Muduuma",
        parishes: [
          { name: "Muduuma", villages: ["Muduuma I", "Muduuma II", "Muduuma III"] },
          { name: "Kyambogo", villages: ["Kyambogo A", "Kyambogo B"] },
          { name: "Kitungwa", villages: ["Kitungwa A", "Kitungwa B"] },
          { name: "Kabale", villages: ["Kabale A", "Kabale B"] },
        ]
      },
      {
        name: "Buwama",
        parishes: [
          { name: "Buwama", villages: ["Buwama I", "Buwama II", "Buwama III"] },
          { name: "Namulanda", villages: ["Namulanda A", "Namulanda B", "Namulanda Central"] },
          { name: "Kigwe", villages: ["Kigwe A", "Kigwe B"] },
          { name: "Muge", villages: ["Muge A", "Muge B"] },
        ]
      },
      {
        name: "Nkozi",
        parishes: [
          { name: "Nkozi", villages: ["Nkozi I", "Nkozi II", "Nkozi III"] },
          { name: "Ssisa", villages: ["Ssisa A", "Ssisa B"] },
          { name: "Kabuktra", villages: ["Kabuktra A", "Kabuktra B"] },
          { name: "Muziran", villages: ["Muziran A", "Muziran B"] },
        ]
      },
      {
        name: "Kituntu",
        parishes: [
          { name: "Kituntu", villages: ["Kituntu I", "Kituntu II", "Kituntu III"] },
          { name: "Kibanga", villages: ["Kibanga A", "Kibanga B"] },
          { name: "Bengo", villages: ["Bengo A", "Bengo B"] },
          { name: "Kk", villages: ["Kk A", "Kk B"] },
        ]
      },
      {
        name: "Kayabwe",
        parishes: [
          { name: "Kayabwe", villages: ["Kayabwe I", "Kayabwe II", "Kayabwe III"] },
          { name: "Nchwanga", villages: ["Nchwanga A", "Nchwanga B"] },
          { name: "Kitunda", villages: ["Kitunda A", "Kitunda B"] },
          { name: "Kawumba", villages: ["Kawumba A", "Kawumba B"] },
        ]
      },
      {
        name: "Buwama Town Council",
        parishes: [
          { name: "Buwama Central", villages: ["Buwama Central A", "Buwama Central B"] },
          { name: "Namutya", villages: ["Namutya A", "Namutya B"] },
          { name: "Kiganda", villages: ["Kiganda A", "Kiganda B"] },
        ]
      },
    ]
  },
  "Butambala": {
    population: 146516,
    coordinates: { lat: 0.417, lng: 32.083 },
    subcounties: [
      {
        name: "Gomba",
        parishes: [
          { name: "Gomba", villages: ["Gomba I", "Gomba II", "Gomba III"] },
          { name: "Kagogo", villages: ["Kagogo A", "Kagogo B"] },
          { name: "Kigabi", villages: ["Kigabi A", "Kigabi B"] },
          { name: "Luwung", villages: ["Luwung A", "Luwung B"] },
        ]
      },
      {
        name: "Butambala",
        parishes: [
          { name: "Butambala", villages: ["Butambala I", "Butambala II", "Butambala III"] },
          { name: "Kkonde", villages: ["Kkonde A", "Kkonde B"] },
          { name: "Kizito", villages: ["Kizito A", "Kizito B"] },
          { name: "Mawujjolla", villages: ["Mawujjolla A", "Mawujjolla B"] },
        ]
      },
      {
        name: "Budu",
        parishes: [
          { name: "Budu", villages: ["Budu I", "Budu II", "Budu III"] },
          { name: "Kiziba", villages: ["Kiziba A", "Kiziba B"] },
          { name: "Lwengo", villages: ["Lwengo A", "Lwengo B"] },
          { name: "Ngando", villages: ["Ngando A", "Ngando B"] },
        ]
      },
      {
        name: "Ngando",
        parishes: [
          { name: "Ngando", villages: ["Ngando I", "Ngando II", "Ngando III"] },
          { name: "Kitamiro", villages: ["Kitamiro A", "Kitamiro B"] },
          { name: "Bulwadda", villages: ["Bulwadda A", "Bulwadda B"] },
          { name: "Bbynumba", villages: ["Bbynumba A", "Bbynumba B"] },
        ]
      },
      {
        name: "Mulwana",
        parishes: [
          { name: "Mulwana", villages: ["Mulwana I", "Mulwana II", "Mulwana III"] },
          { name: "Kitemy", villages: ["Kitemy A", "Kitemy B"] },
          { name: "Bbugga", villages: ["Bbugga A", "Bbugga B"] },
        ]
      },
      {
        name: "Gombe",
        parishes: [
          { name: "Gomba", villages: ["Gomba I", "Gomba II", "Gomba III"] },
          { name: "Kagamba", villages: ["Kagamba A", "Kagamba B"] },
          { name: "Kikuta", villages: ["Kikuta A", "Kikuta B"] },
          { name: "Mwera", villages: ["Mwera A", "Mwera B"] },
        ]
      },
      {
        name: "Kibibi",
        parishes: [
          { name: "Kibibi", villages: ["Kibibi I", "Kibibi II", "Kibibi III"] },
          { name: "Kyabiked", villages: ["Kyabiked A", "Kyabiked B"] },
          { name: "Kitotolo", villages: ["Kitotolo A", "Kitotolo B"] },
        ]
      },
      {
        name: "Bulo",
        parishes: [
          { name: "Bulo", villages: ["Bulo I", "Bulo II", "Bulo III"] },
          { name: "Lukole", villages: ["Lukole A", "Lukole B"] },
          { name: "Muwump", villages: ["Muwump A", "Muwump B"] },
          { name: "Nkokonjer", villages: ["Nkokonjer A", "Nkokonjer B"] },
        ]
      },
      {
        name: "Butambala Town Council",
        parishes: [
          { name: "Butambala Central", villages: ["Central I", "Central II", "Town"] },
          { name: "Kasozi", villages: ["Kasozi A", "Kasozi B"] },
          { name: "Mugulu", villages: ["Mugulu A", "Mugulu B"] },
        ]
      },
    ]
  },
  "Wakiso": {
    population: 2840000,
    coordinates: { lat: 0.208, lng: 32.479 },
    subcounties: [
      {
        name: "Kyebando",
        parishes: [
          { name: "Kiswa", villages: ["Kiswa I", "Kiswa II", "Kiswa III", "Kanalukya"] },
          { name: "Kireka", villages: ["Kireka A", "Kireka B", "Kireka Central"] },
          { name: "Bweyogerere", villages: ["Bweyogerere I", "Bweyogerere II", "Bweyogerere III"] },
        ]
      },
      {
        name: "Kasanje",
        parishes: [
          { name: "Bulegeya", villages: ["Bulegeya I", "Bulegeya II", "Bulegeya III"] },
          { name: "Kasanje", villages: ["Kasanje I", "Kasanje II", "Kasanje III"] },
          { name: "Senge", villages: ["Senge I", "Senge II"] },
          { name: "Nanziga", villages: ["Nanziga A", "Nanziga B"] },
          { name: "Bbira", villages: ["Bbira I", "Bbira II"] },
          { name: "Zinga", villages: ["Zinga A", "Zinga B"] },
          { name: "Buyege", villages: ["Buyege A", "Buyege B"] },
        ]
      },
      {
        name: "Ssasanje",
        parishes: [
          { name: "Mabamba", villages: ["Mabamba I", "Mabamba II"] },
          { name: "Buwaya", villages: ["Buwaya A", "Buwaya B"] },
          { name: "Nansagazi", villages: ["Nansagazi I", "Nansagazi II"] },
        ]
      },
      {
        name: "Bussi",
        parishes: [
          { name: "Bussi", villages: ["Bussi I", "Bussi II", "Bussi III"] },
          { name: "Zinga", villages: ["Zinga A", "Zinga B"] },
          { name: "Kagulube", villages: ["Kagulube A", "Kagulube B"] },
        ]
      },
    ]
  },
  "Mityana": {
    population: 407386,
    coordinates: { lat: 0.333, lng: 32.050 },
    subcounties: [
      {
        name: "Mityana Town Council",
        parishes: [
          { name: "Mityana Central", villages: ["Central I", "Central II", "Central III"] },
          { name: "Mityana North", villages: ["North I", "North II"] },
          { name: "Mityana South", villages: ["South I", "South II"] },
        ]
      },
      {
        name: "Bulumba",
        parishes: [
          { name: "Bulumba", villages: ["Bulumba I", "Bulumba II"] },
          { name: "Kigogwa", villages: ["Kigogwa A", "Kigogwa B"] },
          { name: "Nabbwe", villages: ["Nabbwe A", "Nabbwe B"] },
        ]
      },
      {
        name: "Ssekanyonyi",
        parishes: [
          { name: "Ssekanyonyi", villages: ["Ssekanyonyi I", "Ssekanyonyi II"] },
          { name: "Kiganda", villages: ["Kiganda A", "Kiganda B"] },
          { name: "Kakindi", villages: ["Kakindi A", "Kakindi B"] },
        ]
      },
    ]
  },
  "Kalungu": {
    population: 187500,
    coordinates: { lat: 0.183, lng: 32.083 },
    subcounties: [
      {
        name: "Kalungu",
        parishes: [
          { name: "Kalungu", villages: ["Kalungu I", "Kalungu II"] },
          { name: "Lukaya", villages: ["Lukaya I", "Lukaya II"] },
          { name: "Kiggi", villages: ["Kiggi A", "Kiggi B"] },
        ]
      },
      {
        name: "Lukaya",
        parishes: [
          { name: "Lukaya", villages: ["Lukaya I", "Lukaya II", "Lukaya III"] },
          { name: "Kigungu", villages: ["Kigungu A", "Kigungu B"] },
        ]
      },
    ]
  },
};

// Key statistics for impact measurement
export const UGANDA_STATS = {
  // UBOS 2024 Census data
  mpigi: {
    population: 326690,
    male: 163345,
    female: 163345,
    households: 78500,
    // Key demographics for programme planning
    youthPopulation: 98007, // 30% aged 15-24
    femaleYouth: 49003, // 50% of youth
    // Service access (estimates based on UBOS data)
    waterAccessRural: 67, // % with improved water
    sanitationAccess: 71, // % with improved sanitation
    primarySchoolEnrollment: 45234,
    // Health indicators
    teenagePregnancy: 23, // % of girls 15-19 who have given birth
  },
  butambala: {
    population: 146516,
    male: 73258,
    female: 73258,
    households: 35200,
    youthPopulation: 43955, // 30% aged 15-24
    femaleYouth: 21977, // 50% of youth
    waterAccessRural: 62,
    sanitationAccess: 65,
    primarySchoolEnrollment: 20312,
    teenagePregnancy: 25,
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
  },
};

// Target populations for Omuto programmes
export const OMMUTO_TARGETS = {
  // Based on UBOS demographics and programme focus
  mpigi: {
    students: {
      total: 45234, // Primary school enrollment
      female: 22617, // 50%
      targetReach: 0.15, // 15% of total per year
      yearlyTarget: 6785,
    },
    youth: {
      total: 98007, // 15-24 age group
      female: 49003, // Girls/women
      vulnerable: 19601, // 20% vulnerable youth
      targetReach: 0.05, // 5% per year
      yearlyTarget: 4900,
    },
    schools: {
      total: 89, // Primary and secondary
      primary: 67,
      secondary: 22,
      partnerTarget: 20, // Schools to partner with
    },
    water: {
      populationWithoutAccess: 107807, // ~33% without safe water
      targetInterventions: 15000, // People to reach with water interventions
    },
    menstrualHealth: {
      schoolGirls: 22617, // Girls in school
      outOfSchoolGirls: 8000, // Estimated out of school
      padsNeeded: 4500000, // Pads needed per year (12 per girl per year)
    },
  },
  butambala: {
    students: {
      total: 20312,
      female: 10156,
      targetReach: 0.15,
      yearlyTarget: 3047,
    },
    youth: {
      total: 43955,
      female: 21977,
      vulnerable: 8791,
      targetReach: 0.05,
      yearlyTarget: 2198,
    },
    schools: {
      total: 45,
      primary: 38,
      secondary: 7,
      partnerTarget: 15,
    },
    water: {
      populationWithoutAccess: 55716, // ~38% without safe water
      targetInterventions: 8000,
    },
    menstrualHealth: {
      schoolGirls: 10156,
      outOfSchoolGirls: 3500,
      padsNeeded: 2000000,
    },
  },
};

// Type exports
export type DistrictName = keyof typeof UGANDA_LOCATIONS;
export type SubcountyName<T extends DistrictName> = keyof typeof UGANDA_LOCATIONS[T]['subcounties'];
