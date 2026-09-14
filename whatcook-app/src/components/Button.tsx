import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Mostra o spinner padrão do CTA no lugar do conteúdo, mantendo o botão com o mesmo tamanho. */
  loading?: boolean;
}

/**
 * CTA primário único do app — antes duplicado como `<div className="fab" onClick={...}>` em
 * ~15 telas (sem foco de teclado, sem `disabled` semântico). Reusa a classe `.fab` existente
 * em index.css, então não muda nada visualmente; centraliza estado de loading/disabled.
 */
export default function Button({ loading, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`fab${disabled ? ' disabled' : ''}${className ? ` ${className}` : ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="fab-loading">
          <span className="fab-spinner" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
