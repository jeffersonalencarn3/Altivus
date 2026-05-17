import React from 'react';

/**
 * ErrorBoundary global — captura erros de render sem recarregar a página inteira.
 * Exibe mensagem de erro com opção de tentar novamente.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
        style={{ color: '#A0AEC0' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(252,82,82,0.10)', border: '1px solid rgba(252,82,82,0.25)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#FC5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-1">Algo deu errado</h2>
        <p className="text-sm mb-4 max-w-xs" style={{ color: '#718096' }}>
          {this.state.error?.message || 'Erro inesperado nesta seção.'}
        </p>
        <button
          onClick={this.handleReset}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'rgba(20,184,212,0.10)',
            border: '1px solid rgba(20,184,212,0.25)',
            color: '#14B8D4',
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}