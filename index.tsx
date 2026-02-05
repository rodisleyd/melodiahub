
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '20px';
  errorDiv.innerHTML = '<h1>Erro Crítico</h1><p>Não foi possível encontrar o elemento #root no HTML.</p>';
  document.body.appendChild(errorDiv);
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Render error:", error);
    rootElement.innerHTML = `
      <div style="color: white; background: #1A1A2E; padding: 40px; height: 100vh; font-family: sans-serif;">
        <h1 style="color: #FF6B35;">Ops! Ocorreu um erro ao carregar</h1>
        <p>Tente limpar o cache do navegador ou atualizar a página.</p>
        <pre style="background: #333; padding: 15px; border-radius: 10px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="location.reload()" style="background: #FF6B35; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Tentar Novamente</button>
      </div>
    `;
  }
}
