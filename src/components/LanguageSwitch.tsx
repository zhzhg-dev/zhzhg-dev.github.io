import { useLanguage } from "../i18n";

export function LanguageSwitch() {
  const { language, t, setLanguage } = useLanguage();
  return <div className="language-switch" role="group" aria-label={t("Language", "语言")}>
    <button type="button" lang="zh-CN" aria-label="切换到中文" aria-pressed={language === "zh"} onClick={() => setLanguage("zh")}>中文</button>
    <button type="button" lang="en" aria-label="Switch to English" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
  </div>;
}
