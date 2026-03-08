import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_frontend/')({ component: App });

function App() {
  return <p>Index Page</p>;
}
