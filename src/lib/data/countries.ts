import getUnicodeFlagIcon from 'country-flag-icons/unicode'

interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

export const countries: Country[] = [
  {
    id: "br",
    name: "Brasil",
    code: "br",
    flag: getUnicodeFlagIcon("BR"),
    dialCode: "+55"
  },
  {
    id: "us",
    name: "Estados Unidos",
    code: "us",
    flag: getUnicodeFlagIcon("US"),
    dialCode: "+1"
  },
  {
    id: "pt",
    name: "Portugal",
    code: "pt",
    flag: getUnicodeFlagIcon("PT"),
    dialCode: "+351"
  },
  {
    id: "es",
    name: "Espanha",
    code: "es",
    flag: getUnicodeFlagIcon("ES"),
    dialCode: "+34"
  },
  {
    id: "ar",
    name: "Argentina",
    code: "ar",
    flag: getUnicodeFlagIcon("AR"),
    dialCode: "+54"
  },
  {
    id: "cl",
    name: "Chile",
    code: "cl",
    flag: getUnicodeFlagIcon("CL"),
    dialCode: "+56"
  },
  {
    id: "co",
    name: "Colômbia",
    code: "co",
    flag: getUnicodeFlagIcon("CO"),
    dialCode: "+57"
  },
  {
    id: "mx",
    name: "México",
    code: "mx",
    flag: getUnicodeFlagIcon("MX"),
    dialCode: "+52"
  },
  {
    id: "pe",
    name: "Peru",
    code: "pe",
    flag: getUnicodeFlagIcon("PE"),
    dialCode: "+51"
  },
  {
    id: "uy",
    name: "Uruguai",
    code: "uy",
    flag: getUnicodeFlagIcon("UY"),
    dialCode: "+598"
  },
  {
    id: "py",
    name: "Paraguai",
    code: "py",
    flag: getUnicodeFlagIcon("PY"),
    dialCode: "+595"
  },
  {
    id: "bo",
    name: "Bolívia",
    code: "bo",
    flag: getUnicodeFlagIcon("BO"),
    dialCode: "+591"
  },
  {
    id: "ec",
    name: "Equador",
    code: "ec",
    flag: getUnicodeFlagIcon("EC"),
    dialCode: "+593"
  },
  {
    id: "ve",
    name: "Venezuela",
    code: "ve",
    flag: getUnicodeFlagIcon("VE"),
    dialCode: "+58"
  },
  {
    id: "gb",
    name: "Reino Unido",
    code: "gb",
    flag: getUnicodeFlagIcon("GB"),
    dialCode: "+44"
  },
  {
    id: "fr",
    name: "França",
    code: "fr",
    flag: getUnicodeFlagIcon("FR"),
    dialCode: "+33"
  },
  {
    id: "de",
    name: "Alemanha",
    code: "de",
    flag: getUnicodeFlagIcon("DE"),
    dialCode: "+49"
  },
  {
    id: "it",
    name: "Itália",
    code: "it",
    flag: getUnicodeFlagIcon("IT"),
    dialCode: "+39"
  },
  {
    id: "ca",
    name: "Canadá",
    code: "ca",
    flag: getUnicodeFlagIcon("CA"),
    dialCode: "+1"
  },
  {
    id: "au",
    name: "Austrália",
    code: "au",
    flag: getUnicodeFlagIcon("AU"),
    dialCode: "+61"
  }
].sort((a, b) => a.name.localeCompare(b.name)); 