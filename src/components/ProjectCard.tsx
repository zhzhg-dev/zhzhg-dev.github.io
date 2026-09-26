import type { Project } from "../data/profile";

type ProjectCardProps = {
  project: Project;
  index: number;
  compact?: boolean;
};

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

export function ProjectCard({ project, index, compact = false }: ProjectCardProps) {
  return (
    <article
      className={`project-card reveal ${project.featured ? "project-card--featured" : ""} ${compact ? "project-card--compact" : ""}`}
    >
      <div className="project-card__media">
        <img
          src={project.cover}
          alt={project.coverAlt}
          loading="lazy"
          style={{ objectPosition: project.coverPosition }}
        />
        <span className="project-card__index">0{index + 1}</span>
        <span className="project-card__status">{project.status}</span>
      </div>

      <div className="project-card__body">
        <p className="project-card__eyebrow">{project.eyebrow}</p>
        <h2>{project.title}</h2>
        <p className="project-card__description">{project.description}</p>

        <ul className="tag-list" aria-label={`${project.title} technologies`}>
          {project.technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>

        <div className="project-card__links">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              Live demo <ExternalArrow />
            </a>
          )}
          {project.sourceUrl && (
            <a href={project.sourceUrl} target="_blank" rel="noreferrer">
              Source code <ExternalArrow />
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
