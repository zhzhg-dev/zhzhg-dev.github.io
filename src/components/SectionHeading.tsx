type SectionHeadingProps = {
  id: string;
  index?: string;
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <header className="section-heading">
      <p className="section-heading__eyebrow">{eyebrow}</p>
      <div className="section-heading__copy">
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
