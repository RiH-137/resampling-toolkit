import './globals.css';

export const metadata = {
  title: 'Bootstrap & Jackknife Lab',
  description: 'Resampling toolkit for bootstrap and jackknife methods.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
