import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    const { className, ...rest } = props;
    return <input ref={ref} {...rest} className={['input', className].filter(Boolean).join(' ')} />;
  },
);
