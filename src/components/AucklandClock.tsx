import { useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "../i18n";

const timeZone = "Pacific/Auckland";
const minute = 60_000;

export function formatAucklandClock(now: Date, language: Language): { time: string; date: string } {
  const locale = language === "zh" ? "zh-CN" : "en-NZ";
  return {
    time: new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now),
    date: new Intl.DateTimeFormat(locale, { timeZone, weekday: "short", month: "short", day: "numeric" }).format(now),
  };
}

export function AucklandClock() {
  const { language, t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: number;
    function update() {
      const instant = Date.now();
      setNow(instant);
      timer = window.setTimeout(update, minute - instant % minute);
    }
    update();
    const clock = clockRef.current;
    if (clock && window.matchMedia("(max-width: 760px)").matches && clock.getBoundingClientRect().bottom > window.innerHeight - 16) {
      clock.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
    return () => window.clearTimeout(timer);
  }, []);

  const instant = new Date(now);
  const { time, date } = formatAucklandClock(instant, language);
  return <div className="studio-window-clock" ref={clockRef} aria-live="off">
    <span className="studio-window-clock__label">{t("Local time", "当地时间")}</span>
    <time dateTime={instant.toISOString()}>{time}</time>
    <span className="studio-window-clock__date">{date}</span>
  </div>;
}
