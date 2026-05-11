import './globals.css';
import Shell from '@/src/components/Shell';

export const metadata = {
  title: 'AI Codebase Intelligence',
  description: 'Understand any codebase in minutes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"/>
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
