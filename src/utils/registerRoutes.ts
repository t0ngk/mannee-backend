import fs from 'fs';
import type { Express } from 'express';

export default function registerRoutes(app: Express, path: string, routePath: string | null = null) {
  const routes = fs.readdirSync(path);
  routes.forEach(async (route) => {
    const routeName = route.split('.')[0];
    if (route.endsWith('.ts') || route.endsWith('.js')) {
      const routeHandler = await import(`${path}/${routeName}`);
      if (!routeHandler.default || typeof routeHandler.default !== 'function') {
        console.log(`Route: ${routeName} does not have a default export.`);
        return;
      }
      console.log(`Route: /${routeName} registered.`);
      app.use(`/${routeName}`, routeHandler.default);
    } else {
      registerRoutes(app, `${path}/${routeName}`, routeName);
    }
  });
}
