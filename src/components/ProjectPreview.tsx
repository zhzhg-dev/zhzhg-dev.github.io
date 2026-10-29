import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { Project } from "../data/profile";

type ProjectPreviewProps = {
  project: Project;
  className?: string;
};

const openPreviews = new Set<HTMLDialogElement>();

function releasePage(dialog: HTMLDialogElement) {
  if (!openPreviews.delete(dialog)) return;
  if (openPreviews.size === 0) document.body.classList.remove("preview-open");
}

export function ProjectPreview({ project, className }: ProjectPreviewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const originalRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const dialogId = `${titleId}-dialog`;

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (!dialog) return;
      if (dialog.open) dialog.close();
      releasePage(dialog);
    };
  }, []);

  function openPreview(event: MouseEvent<HTMLButtonElement>) {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.isConnected || dialog.open) return;
    triggerRef.current = event.currentTarget;
    dialog.showModal();
    openPreviews.add(dialog);
    document.body.classList.add("preview-open");
    closeRef.current?.focus({ preventScroll: true });
  }

  function closePreview() {
    dialogRef.current?.close();
  }

  function restorePage() {
    const dialog = dialogRef.current;
    if (dialog) releasePage(dialog);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left
      || event.clientX > bounds.right
      || event.clientY < bounds.top
      || event.clientY > bounds.bottom;
    if (outside) dialog.close();
  }

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const first = closeRef.current;
    const last = originalRef.current;
    if (!first || !last) return;
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <figure className={["project-preview", className].filter(Boolean).join(" ")}>
      <button
        className="project-preview__image"
        type="button"
        aria-label={`Expand ${project.title} screenshot`}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={openPreview}
      >
        <img
          src={project.cover}
          alt={project.coverAlt}
          width={project.coverWidth ?? 1440}
          height={project.coverHeight ?? 1000}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: project.coverPosition }}
        />
      </button>
      <figcaption className="project-preview__caption">
        <span>Interface preview</span>
        <button
          className="project-preview__expand"
          type="button"
          aria-label={`Expand ${project.title} preview`}
          aria-haspopup="dialog"
          aria-controls={dialogId}
          onClick={openPreview}
        >
          Expand preview
        </button>
      </figcaption>
      <dialog
        ref={dialogRef}
        id={dialogId}
        className="project-preview__dialog"
        aria-labelledby={titleId}
        onClick={closeOnBackdrop}
        onClose={restorePage}
        onKeyDown={keepFocusInside}
      >
        <div className="project-preview__dialog-header">
          <h2 className="project-preview__dialog-title" id={titleId}>
            <span translate="no">{project.title}</span> Screenshot
          </h2>
          <button
            ref={closeRef}
            className="project-preview__close"
            type="button"
            onClick={closePreview}
          >
            <span aria-hidden="true">×</span>
            Close preview
          </button>
        </div>
        <div className="project-preview__dialog-media">
          <img
            className="project-preview__full-image"
            src={project.cover}
            alt={project.coverAlt}
            width={project.coverWidth ?? 1440}
            height={project.coverHeight ?? 1000}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="project-preview__dialog-footer">
          <a
            ref={originalRef}
            href={project.cover}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${project.title} original screenshot in a new tab`}
          >
            Open original image <span aria-hidden="true">↗</span>
          </a>
        </div>
      </dialog>
    </figure>
  );
}
