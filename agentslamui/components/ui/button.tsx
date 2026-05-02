"use client";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`nbtn ${props.className ?? ""}`.trim()} />;
}
