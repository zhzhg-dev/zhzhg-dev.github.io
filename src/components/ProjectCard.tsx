import type { Project } from "../data/profile";

type ProjectCardProps = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <article className={`project-card reveal ${project.featured ? "project-card--featured" : ""}`}>
      <div className="project-card__topline">
        <span className="project-card__number">0{index + 1}</span>
        <span className="project-card__eyebrow">{project.eyebrow}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <ul className="tag-list" aria-label={`${project.title} technologies`}>
        {project.technologies.map((technology) => (
          <li key={technology}>{technology}</li>
        ))}
      </ul>
      <a className="text-link" href={project.link.href} target="_blank" rel="noreferrer">
        {project.link.label}
        <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
