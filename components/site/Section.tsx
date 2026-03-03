export default function Section({
  eyebrow,
  title,
  subtitle,
  children,
  id,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="py-10 md:py-14">
      <div className="mb-6">
        {eyebrow ? (
          <div className="text-xs font-semibold tracking-widest text-white/55">
            {eyebrow.toUpperCase()}
          </div>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}