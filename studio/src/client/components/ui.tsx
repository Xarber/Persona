// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X, ArrowUpRight, Plus, Search } from 'lucide-react';
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      className={wide ? 'modal wide' : 'modal'}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={headingId}>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-symbol">✳</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = 'Search websites…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-box">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export const NewButton = ({
  onClick,
  label = 'Create a website',
}: {
  onClick: () => void;
  label?: string;
}) => (
  <button className="primary" onClick={onClick}>
    <Plus size={16} />
    {label}
  </button>
);
export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="error-box">
      {error}
    </p>
  ) : null;
}
export function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
