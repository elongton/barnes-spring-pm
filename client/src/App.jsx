import { RouterProvider, useRouter, match } from './router.jsx';
import { StoreProvider, useStore } from './store.jsx';
import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { CalendarPage } from './pages/CalendarPage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';
import { ProjectPage } from './pages/ProjectPage.jsx';
import { PeoplePage } from './pages/PeoplePage.jsx';

function Routes() {
  const { path } = useRouter();
  const { loading, projects } = useStore();
  if (loading && !projects.length) return <div className="loading">Loading…</div>;
  const project = match('/projects/:id', path);
  if (project) return <ProjectPage id={project.id} key={project.id} />;
  if (path === '/calendar') return <CalendarPage />;
  if (path === '/projects') return <ProjectsPage />;
  if (path === '/people') return <PeoplePage />;
  return <Home />;
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <Layout><Routes /></Layout>
      </StoreProvider>
    </RouterProvider>
  );
}
