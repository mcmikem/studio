export const UGANDA_LOCATIONS = {
  Wakiso: {
    Kasanje: [
      "Bulegeya",
      "Kasanje",
      "Senge",
      "Nanziga",
      "Bbira",
      "Zinga",
      "Buyege"
    ],
    Ssasanje: [
      "Mabamba",
      "Buwaya",
      "Nansagazi"
    ],
    Bussi: [
      "Bussi",
      "Zinga",
      "Kagulube"
    ]
  },
  Mpigi: {
    "Mpigi Town Council": [
      "Kazinga",
      "Kafumu",
      "Mpigi Central"
    ],
    Kiringente: [
      "Kiringente",
      "Jjalamba"
    ]
  }
};

export type District = keyof typeof UGANDA_LOCATIONS;
export type Subcounty<D extends District> = keyof typeof UGANDA_LOCATIONS[D];
