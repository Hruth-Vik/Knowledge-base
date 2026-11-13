import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router.js';
import './design/global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('The application root is missing from index.html.');
}

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
