import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProductList } from '../features/product/components/ProductList';
import { ProductDetail } from '../features/product/components/ProductDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <ProductList />,
      },
      {
        path: 'product/:id',
        element: <ProductDetail />,
      },
    ],
  },
]);
