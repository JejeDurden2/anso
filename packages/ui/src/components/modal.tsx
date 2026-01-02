import { X } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn('card relative max-h-[90vh] w-full max-w-lg overflow-auto', className)}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </Fragment>
  );
}

export interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps): JSX.Element {
  return (
    <div className={cn('flex items-center justify-between border-b border-slate-200 px-6 py-4', className)}>
      <h2 className="text-lg font-semibold text-slate-900">{children}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps): JSX.Element {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps): JSX.Element {
  return (
    <div className={cn('flex justify-end gap-3 border-t border-slate-200 px-6 py-4', className)}>
      {children}
    </div>
  );
}
