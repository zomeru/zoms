import type { Metadata } from 'next';
import type React from 'react';

import AdminConsole from '@/components/admin/AdminConsole';
import { SITE_URL } from '@/configs/seo';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Secure admin surface for manual blog generation and targeted AI reindexing.',
  robots: {
    follow: false,
    index: false
  },
  openGraph: {
    description: 'Secure admin surface for manual blog generation and targeted AI reindexing.',
    title: 'Admin',
    type: 'website',
    url: `${SITE_URL}/admin`
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Secure admin surface for manual blog generation and targeted AI reindexing.',
    title: 'Admin'
  },
  alternates: {
    canonical: `${SITE_URL}/admin`
  }
};

const AdminPage: React.FC = (): React.JSX.Element => <AdminConsole />;

export default AdminPage;
