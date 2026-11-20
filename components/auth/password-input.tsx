"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { inputCls } from "@/components/ui/modal";

/** A password field with an eye button to show or hide what was typed. */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  disabled,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled: boolean;
  label: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        required
        disabled={disabled}
        aria-label={label}
        placeholder={label}
        className={`${inputCls} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-2xl text-muted hover:text-ink"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
