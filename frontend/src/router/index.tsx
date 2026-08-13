import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminDbPage } from '@/pages/Admin/AdminDbPage'
import { AdminUsersPage } from '@/pages/Admin/AdminUsersPage'
import { ComparePage } from '@/pages/Compare/ComparePage'
import { HomePage } from '@/pages/Home/HomePage'
import { LoginPage, RegisterPage } from '@/pages/Login/AuthPages'
import { PenDetailPage } from '@/pages/PenDetail/PenDetailPage'
import { PensPage } from '@/pages/Pens/PensPage'
import { FavoritesPage } from '@/pages/Profile/FavoritesPage'
import { ProfilePage } from '@/pages/Profile/ProfilePage'
import { BrandPage } from '@/pages/Brands/BrandPage'
import { FindPage } from '@/pages/Recommendation/FindPage'
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/pens', element: <PensPage /> },
      { path: '/pens/:slug', element: <PenDetailPage /> },
      { path: '/brands/:slug', element: <BrandPage /> },
      { path: '/find', element: <FindPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/favorites',
        element: (
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute admin>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/db',
        element: (
          <ProtectedRoute admin>
            <AdminDbPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])
