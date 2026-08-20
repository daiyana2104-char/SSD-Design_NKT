import { type ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex items-center justify-between text-left"
      >
        <span className={cn(!selected && 'text-brown-300')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 text-brown-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-brown-100 bg-white py-1 shadow-card-hover">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-cream-100',
                o.value === value && 'bg-cream-50 text-maroon-700',
              )}
            >
              {o.label}
              {o.value === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Select...',
  className,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = (val: string) => {
    onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);
  };

  const selectedLabels = options.filter((o) => values.includes(o.value));

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex min-h-[42px] items-center justify-between text-left"
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selectedLabels.length === 0 ? (
            <span className="text-brown-300">{placeholder}</span>
          ) : (
            selectedLabels.map((s) => (
              <span key={s.value} className="inline-flex items-center gap-1 rounded bg-maroon-50 px-2 py-0.5 text-xs text-maroon-700">
                {s.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggle(s.value); }}
                  className="rounded-full hover:bg-maroon-100"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 text-brown-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-brown-100 bg-white py-1 shadow-card-hover">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-cream-100"
            >
              {o.label}
              {values.includes(o.value) && <Check className="h-4 w-4 text-maroon-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormField({
  label,
  required,
  children,
  hint,
  className,
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  className?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label} {required && <span className="text-maroon-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-brown-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('input', props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('input min-h-[80px]', props.className)} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  const toggle = () => onChange(!checked);
  const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? 'Toggle'}
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKey}
        className={cn(
          'relative h-6 w-12 shrink-0 rounded-full border-0 p-0 transition-colors focus:outline-none focus:ring-2 focus:ring-maroon-500',
          checked ? 'bg-maroon-600' : 'bg-brown-200',
        )}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
      {label && <span className="text-sm text-brown-700">{label}</span>}
    </label>
  );
}

export function RadioGroup({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-brown-700">
          <input
            type="radio"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="h-4 w-4 accent-maroon-600"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
