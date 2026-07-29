/** A labeled group of related fields within a form - uppercase muted
 * heading, optional hint line, then the fields. Pair with <Separator />
 * between sections so a long form reads as distinct steps instead of one
 * undifferentiated stack of inputs. */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{title}</h4>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
