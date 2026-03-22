export const UGANDA_LOCATIONS = {
  Mpigi: {
    "Mpigi Town Council": ["Kafumu", "Kazinga", "Mpigi Central", "Bugombe", "Najja"],
    Kammengo: ["Kammengo", "Luba", "Misenyi", "Bunya", "Nabitende", "Nabbuzi"],
    Kiringente: ["Kiringente", "Jjalamba", "Bweya", "Kisegwa", "Mudunde"],
    Muduuma: ["Muduuma", "Kyambogo", "Kitungwa", "Kabale"],
    Buwama: ["Buwama", "Namulanda", "Kigwe", "Muge"],
    Nkozi: ["Nkozi", "Ssisa", "Kabuktra", "Muziran"],
    Kituntu: ["Kituntu", "Kibanga", "Bengo", "Kk"],
    Kayabwe: ["Kayabwe", "Nchwanga", "Kitunda", "Kawumba"],
    "Buwama Town Council": ["Buwama Central", "Namutya", "Kiganda"],
  },
  Butambala: {
    "Gombe Town Council": ["Gombe", "Kagamba", "Kikuta", "Mwera"],
    Ngando: ["Ngando", "Kitamiro", "Bulwadda", "Bbynumba"],
    Kibibi: ["Kibibi", "Kyabiked", "Kitotolo", "Bukalua"],
    Bulo: ["Bulo", "Lukole", "Muwump", "Nkokonjer", "Watangalala"],
    Budde: ["Budde", "Kiziba", "Lwengo", "Ngando"],
    Kalamba: ["Kalamba", "Kizito", "Kkonde", "Mawujjolla"],
    Budu: ["Budu", "Kiziba", "Lwengo", "Ngando"],
  },
  Masaka: {
    Kyanamukaka: ["Kyanamukaka", "Kigando", "Kibbe", "Kitenge"],
    Kyesiiga: ["Kyesiiga", "Kakundamura", "Kyamuli", "Nabugala"],
    Buwunga: ["Buwunga", "Kigoggwa", "Kakindu", "Namirembe"],
    Bukakata: ["Bukakata", "Kigungu", "Dziyaka", "Misanunga"],
  },
  Kampala: {
    "Central Division": ["Kampala Central", "Nakasero", "Industrial Area", "Kikulu"],
    "Kawempe Division": ["Kawempe North", "Kawempe South", "Lubya", "Bwaise"],
    "Nakawa Division": ["Nakawa", "Kisuga", "Butabika", "Luzira"],
    "Makindye Division": ["Makindye East", "Makindye West", "Kisenyi", "Kibuli"],
    "Rubaga Division": ["Rubaga North", "Rubaga South", "Nsambya", "Namirembe"],
  },
  Wakiso: {
    Kyebando: ["Kiswa", "Kireka", "Bweyogerere", "Naddangungulu"],
    Kasanje: ["Bulegeya", "Kasanje", "Senge", "Nanziga", "Bbira", "Zinga", "Buyege"],
    Ssasagazi: ["Mabamba", "Buwaya", "Nansagazi"],
    Bussi: ["Bussi", "Zinga", "Kagulube"],
  },
  Kalungu: {
    Kalungu: ["Kalungu", "Lukaya", "Kiggi", "Kigungu"],
    Lukaya: ["Lukaya", "Kigungu", "Mabanga", "Bukuluni"],
  },
};

export type District = keyof typeof UGANDA_LOCATIONS;
export type Subcounty<D extends District> = keyof typeof UGANDA_LOCATIONS[D];
