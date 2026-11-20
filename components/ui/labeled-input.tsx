"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { inputCls } from "./modal";

/**
 * A text box whose label stays visible: it sits inside the box like a
 * placeholder, then moves to the top corner once the box has focus or text.
 * Unlike a placeholder, the label never disappears while someone types.
 * The box keeps the height of a plain input, so layouts don't shift.
 */
export function LabeledInput({
  label,
  trailing,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string;
  /** Something inside the box on the right, e.g. a show-password button. */
  trailing?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="relative">
      <input id={id} placeholder=" " {...props} className={`${inputCls} peer pb-0.5 pt-[18px] ${className}`} />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1.5 text-[11px] leading-none text-muted transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px]"
      >
        {label}
      </label>
      {trailing}
    </div>
  );
}
