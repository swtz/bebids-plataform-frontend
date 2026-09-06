import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';
import { Button } from './Button';

export interface EntityPickerOption {
  value: string;
  label: string;
  meta?: string;
  selected?: boolean;
}

interface EntityPickerSheetProps {
  open: boolean;
  title: string;
  icon?: LucideIcon;
  options: EntityPickerOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
  emptyMessage?: string;
}

/**
 * Substitui um `<select>` nativo para escolher Cliente/Motoboy/Operador/
 * Estabelecimento — um bottom-sheet com lista rolável, ícone + nome + uma
 * linha de meta-info, marca de seleção. Um componente genérico só,
 * parametrizado por `options`, em vez de N variações copiadas por tela.
 *
 * Nota de implementação: o ícone de check fica sempre montado (opacidade
 * 0/1 conforme `selected`) em vez de ser condicionalmente renderizado —
 * montar/desmontar um filho na linha que acabou de ser tocada é frágil em
 * React (o handoff original relatou um crash de re-render nesse padrão no
 * protótipo).
 */
export function EntityPickerSheet({
  open,
  title,
  icon: Icon,
  options,
  onSelect,
  onClose,
  emptyMessage = 'Nenhuma opção disponível.',
}: EntityPickerSheetProps) {
  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      style={{ alignItems: 'flex-end', padding: 0 }}
      onClick={onClose}
    >
      <div
        className="dialog"
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="dialog-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
          {Icon && <Icon size={18} strokeWidth={2.5} />}
          {title}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {options.length === 0 && (
            <p className="text-muted" style={{ fontSize: 13 }}>
              {emptyMessage}
            </p>
          )}
          {options.map(opt => (
            <button
              key={opt.value || '__empty__'}
              type="button"
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                background: opt.selected ? 'var(--color-accent-100)' : 'transparent',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--color-accent-2-100)',
                  color: 'var(--color-accent-2-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                }}
              >
                {opt.label.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {opt.label}
                </div>
                {opt.meta && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{opt.meta}</div>
                )}
              </div>
              {/* Sempre montado — só a opacidade muda com `selected` (ver nota acima). */}
              <Check size={16} style={{ opacity: opt.selected ? 1 : 0, flexShrink: 0 }} />
            </button>
          ))}
        </div>

        <div className="dialog-actions" style={{ justifyContent: 'stretch' }}>
          <Button variant="secondary" className="btn-block" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
