import { createBrowserRouter } from 'react-router-dom';
import { ProductList } from '../features/product/components/ProductList';
import { ProductDetail } from '../features/product/components/ProductDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProductList />,
  },
  {
    path: '/product/:id',
    element: <ProductDetail />,
  },
]);
