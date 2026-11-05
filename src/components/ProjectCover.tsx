import type { Project } from "../data/profile";
import { useLanguage } from "../i18n";
import "./project-cover.css";

const compositions: Record<string, { name: string; line: string; lineZh: string }> = {
  folio: { name: "Folio", line: "Keep the evidence close.", lineZh: "让证据始终在身边。" },
  explainlab: { name: "ExplainLab", line: "Systems, made visible.", lineZh: "让系统的运转看得见。" },
  "nz-electricity-forecasting": { name: "NZ Electricity", line: "Demand, with context.", lineZh: "读懂需求背后的变化。" },
};

export function ProjectCover({ project, index }: { project: Project; index: number }) {
  const { t } = useLanguage();
  const composition = compositions[project.slug];
  if (!composition) return <img src={project.cover} alt={project.coverAlt} width={project.coverWidth ?? 1280} height={project.coverHeight ?? 720} loading={index < 3 ? "eager" : "lazy"} decoding="async" style={{ objectPosition: project.coverPosition ?? "center", objectFit: project.coverFit ?? "cover" }} />;
  return <span className={`project-cover project-cover--${project.slug}`} aria-hidden="true">
    <span className="project-cover__identity"><span className="project-cover__name" translate="no">{composition.name}</span><span className="project-cover__line">{t(composition.line, composition.lineZh)}</span></span>
    <span className="project-cover__frame"><img src={project.cover} alt={project.coverAlt} width={project.coverWidth ?? 1280} height={project.coverHeight ?? 720} loading={index < 3 ? "eager" : "lazy"} decoding="async" /></span>
  </span>;
}
