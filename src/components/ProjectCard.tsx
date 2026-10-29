import type { Project } from "../data/profile";

type ProjectCardProps = {
  project: Project;
  index: number;
  compact?: boolean;
};

export function ProjectCard({ project, index, compact = false }: ProjectCardProps) {
  return (
    <article
      className={`project-card ${project.featured ? "project-card--featured" : ""} ${compact ? "project-card--compact" : ""}`}
      data-project-order={index + 1}
      aria-labelledby={`archive-${project.slug}-title`}
    >
      <div className="project-card__media">
        <img
          src={project.cover}
          alt={project.coverAlt}
          width={project.coverWidth}
          height={project.coverHeight}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: project.coverPosition }}
        />
        <span className="project-card__status">{project.status}</span>
      </div>

      <div className="project-card__body">
        <p className="project-card__eyebrow">{project.eyebrow}</p>
        <h2 id={`archive-${project.slug}-title`}>{project.title}</h2>
        <p className="project-card__description">{project.description}</p>

        <ul className="tag-list" aria-label={`${project.title} technologies`}>
          {project.technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>

        <div className="project-card__links">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${project.title} live demo in a new tab`}
            >
              View demo
            </a>
          )}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${project.title} source code in a new tab`}
            >
              View source
            </a>
          )}
          {!project.liveUrl && !project.sourceUrl && (
            <span className="project-card__private">Case study summary</span>
          )}
        </div>
      </div>
    </article>
  );
}
