import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (i: number) => refs.current[i]?.focus();

  const update = (idx: number, digit: string) => {
    const next = [...values];
    next[idx] = digit;
    setValues(next);

    if (digit && idx < length - 1) {
      focusAt(idx + 1);
    }

    const code = next.join('');
    if (code.length === length && next.every(Boolean)) {
      onComplete(code);
    }
  };

  const handleKey = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (values[idx]) {
        update(idx, '');
      } else if (idx > 0) {
        update(idx - 1, '');
        focusAt(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusAt(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      focusAt(idx + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = [...values];
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }
    setValues(next);
    const code = next.join('');
    if (code.length === length) {
      onComplete(code);
    } else {
      focusAt(text.length);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          disabled={disabled}
          className="h-12 w-10 rounded-lg border border-gray-700 bg-gray-800 text-center text-lg font-mono text-white
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none
                     disabled:opacity-40 transition-colors"
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, '').slice(-1);
            update(i, digit);
          }}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
