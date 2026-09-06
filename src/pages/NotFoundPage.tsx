import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar ao início</Link>
    </div>
  );
}
