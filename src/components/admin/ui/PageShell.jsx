export default function PageShell({ title, subtitle, children }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6 p-12px">
      <header className="rounded-2xl border-[1px] border-brand-line bg-brand-soft px-16px py-[14px]">
        <h1 className="m-0 text-[28px] font-semibold leading-tight text-ink max-[720px]:text-[22px]">{title}</h1>
        {subtitle && <p className="m-0 mt-1 text-[13px] text-brand-dark">{subtitle}</p>}
      </header>
      <div className="flex min-w-0 flex-col gap-16px">{children}</div>
    </section>
  );
}
