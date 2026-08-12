"use client";

type ComingSoonSectionProps = {
  title: string;
  subtitle?: string;
};

export function ComingSoonSection({ title, subtitle }: ComingSoonSectionProps) {
  return (
    <div className="glass-panel rounded-2xl px-10 py-20 text-center">
      <p className="admin-heading-section">{title}</p>
      {subtitle ? <p className="admin-copy-lead mx-auto mt-3 max-w-md">{subtitle}</p> : null}
    </div>
  );
}
