import { useLocation } from "react-router-dom";
import { useConfig } from "./useConfig.js";

type UseLocaleReturnType = { locale: string; defaultLocale: string };

export function useLocale(): UseLocaleReturnType {
  const { pathname } = useLocation();
  const config = useConfig();

  // Get all locales
  const prefixLocales = [
    config?.defaultLocale?.lang,
    ...Object.keys(config?.locales ?? {}).map((i) =>
      config?.locales ? config.locales[i]?.lang : null
    ),
  ];

  // Regex for removal
  const regexString = `^\/(${prefixLocales.join("|")})`;
  const regex = new RegExp(regexString);
  const match = pathname.match(regex);
  //   console.log({ match });
  //   console.log({ match: `${match?.[1] ?? ""}` });

  return {
    locale: `${match?.[1] ?? ""}`,
    defaultLocale: config?.defaultLocale?.lang ?? "",
  };
}
