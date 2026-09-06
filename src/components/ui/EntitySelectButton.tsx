import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { EntityPickerSheet, type EntityPickerOption } from './EntityPickerSheet';

interface EntitySelectButtonProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: EntityPickerOption[];
  /** Título mostrado no topo do sheet/drawer — por padrão, reaproveita `placeholder` ou "Selecione". */
  title?: string;
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

/**
 * Um "campo de seleção" completo: botão no estilo `.input` + o
 * `EntityPickerSheet` que ele abre — controla seu próprio estado de
 * aberto/fechado, então funciona tanto solto numa página (com `useState`
 * local) quanto dentro do `DynamicForm` (via `Controller` do
 * react-hook-form) sem precisar saber de nenhum dos dois.
 */
export function EntitySelectButton({
  id,
  value,
  onChange,
  options,
  title,
  placeholder = 'Selecione…',
  icon,
  disabled,
}: EntitySelectButtonProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        className="input"
        onClick={() => setOpen(true)}
        style={{
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
      </button>

      <EntityPickerSheet
        open={open}
        title={title ?? placeholder}
        icon={icon}
        options={options.map(opt => ({ ...opt, selected: opt.value === value }))}
        onSelect={v => {
          onChange(v);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
