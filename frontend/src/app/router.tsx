import { createBrowserRouter } from 'react-router-dom';
import { ProductPage } from '../features/product/components/ProductPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProductPage />,
  },
  {
    path: '/product/:id',
    element: <ProductPage />,
  },
]);
