import type { Project } from "../data/profile";
import { ProjectPreview } from "./ProjectPreview";
import "./projects.css";

type FeaturedWorkProps = {
  projects: Project[];
  detailed?: boolean;
};

export function FeaturedWork({ projects, detailed = false }: FeaturedWorkProps) {
  return (
    <div className={`featured-work projects-editorial${detailed ? " featured-work--detailed" : ""}`}>
      {projects.map((project) => {
        return (
          <article
            id={project.slug}
            key={project.slug}
            className={`feature-case feature-case--${project.slug}`}
            aria-labelledby={`${project.slug}-title`}
          >
            <ProjectPreview project={project} className="feature-case__media" />

            <div className="feature-case__content">
              <header className="feature-case__heading">
                <h2 className="feature-case__title" id={`${project.slug}-title`} translate="no">
                  {project.title}
                </h2>
                <p className="feature-case__status">{project.status}</p>
              </header>

              <div className="feature-case__reading">
                <p className="feature-case__summary">
                  {project.shortDescription ?? project.description}
                </p>

                <div className="feature-case__links">
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
                </div>

                {(detailed || project.decision) && (
                  <details className="project-details">
                    <summary>Design &amp; implementation</summary>
                    <div className="project-details__body">
                      {detailed && project.shortDescription && (
                        <p className="feature-case__description">{project.description}</p>
                      )}

                      {project.decision && (
                        <div className="feature-case__decision">
                          <h3>{project.decisionTitle ?? "A design decision"}</h3>
                          <p>{project.decision}</p>
                        </div>
                      )}

                      {detailed && (
                        <ul
                          className="feature-case__technologies project-technologies"
                          aria-label={`${project.title} technologies`}
                        >
                          {project.technologies.map((technology) => (
                            <li key={technology}>{technology}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
