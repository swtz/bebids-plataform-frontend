import { forwardRef, type InputHTMLAttributes } from 'react';

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox(props, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        {...props}
        style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', ...props.style }}
      />
    );
  },
);
