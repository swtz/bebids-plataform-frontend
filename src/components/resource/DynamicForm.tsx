import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type FieldValues } from 'react-hook-form';
import type { ZodType, ZodTypeDef } from 'zod';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EntityPickerSheet } from '@/components/ui/EntityPickerSheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import { timeToIso } from '@/lib/timeUtils';
import type { FieldConfig } from './FieldConfig';

interface DynamicFormProps<T extends FieldValues> {
  // O terceiro parâmetro (Input) fica em `any`: schemas com `optionalNullable`
  // usam `z.preprocess`, cujo tipo de entrada bruta é `unknown` (o valor cru
  // do <input>), diferente do tipo de saída `T` já validado/transformado.
  schema: ZodType<T, ZodTypeDef, any>;
  fields: FieldConfig[];
  defaultValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
}

function getError(errors: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = errors;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  const message = (current as { message?: string } | undefined)?.message;
  return message;
}

export function DynamicForm<T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar',
  isSubmitting,
  serverError,
}: DynamicFormProps<T>) {
  const isMobile = useIsMobile();
  const [activePickerField, setActivePickerField] = useState<FieldConfig | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as never,
  });

  const groups = new Map<string | undefined, FieldConfig[]>();
  for (const field of fields) {
    const list = groups.get(field.group) ?? [];
    list.push(field);
    groups.set(field.group, list);
  }

  const renderField = (field: FieldConfig) => {
    const errorMessage = getError(errors as Record<string, unknown>, field.name);
    // Campos "time": o <input type="time"> só entrega "HH:mm" — setValueAs
    // converte para ISO8601 completo (data de referência fixa) no exato
    // momento em que o react-hook-form lê o valor para validar/enviar, sem
    // precisar de um componente controlado à parte.
    const registration =
      field.type === 'time'
        ? register(field.name as never, { setValueAs: (v: string) => timeToIso(v) })
        : register(field.name as never);

    return (
      <div className="form-field" key={field.name}>
        <label htmlFor={field.name}>{field.label}</label>
        {field.type === 'select' && isMobile ? (
          // No mobile, todo campo "select" vira um botão que abre um
          // bottom-sheet (EntityPickerSheet) em vez do <select> nativo —
          // um mecanismo só, dentro do DynamicForm, em vez de reimplementar
          // isso em cada tela que usa um campo de seleção.
          <Controller
            name={field.name as never}
            control={control}
            render={({ field: rhfField }) => {
              const selectedOption = field.options?.find(o => o.value === rhfField.value);
              const isPickerOpen = activePickerField?.name === field.name;
              return (
                <>
                  <button
                    type="button"
                    id={field.name}
                    className="input"
                    onClick={() => setActivePickerField(field)}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: selectedOption ? 'var(--color-text)' : 'var(--color-text-muted)',
                      }}
                    >
                      {selectedOption?.label ?? 'Selecione…'}
                    </span>
                    <ChevronDown size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
                  </button>
                  {isPickerOpen && (
                    <EntityPickerSheet
                      open
                      title={field.label}
                      options={(field.options ?? []).map(opt => ({
                        ...opt,
                        selected: opt.value === rhfField.value,
                      }))}
                      onSelect={value => {
                        rhfField.onChange(value);
                        setActivePickerField(null);
                      }}
                      onClose={() => setActivePickerField(null)}
                    />
                  )}
                </>
              );
            }}
          />
        ) : field.type === 'select' ? (
          <Select id={field.name} {...registration}>
            <option value="">Selecione…</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        ) : field.type === 'checkbox' ? (
          <Checkbox id={field.name} {...registration} />
        ) : field.type === 'textarea' ? (
          <textarea
            id={field.name}
            placeholder={field.placeholder}
            {...registration}
            className="input"
            style={{ minHeight: 90, fontFamily: 'inherit' }}
          />
        ) : (
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            step={field.type === 'number' ? '0.01' : undefined}
            {...registration}
          />
        )}
        {field.helperText && !errorMessage && (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {field.helperText}
          </span>
        )}
        {errorMessage && <span className="error">{errorMessage}</span>}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(async values => onSubmit(values))}
      noValidate
    >
      {serverError && <ErrorMessage message={serverError} />}

      {[...groups.entries()].map(([group, groupFields]) =>
        group ? (
          <fieldset className="fieldset" key={group}>
            <legend>{group}</legend>
            <div className="form-grid">{groupFields.map(renderField)}</div>
          </fieldset>
        ) : (
          <div className="form-grid" key="ungrouped">
            {groupFields.map(renderField)}
          </div>
        ),
      )}

      <div className="form-actions">
        <Button type="submit" isLoading={isSubmitting || isFormSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
