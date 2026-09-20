import './globals.css';
import FormationIconEnhancer from './FormationIconEnhancer';
import Script from 'next/script';

export const metadata = {
  title: 'Lands of Jail Trial Cage Generator',
  description: 'Trial Cage formation generator for Lands of Jail',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <FormationIconEnhancer />
        <Script id="vercel-analytics-init" strategy="afterInteractive">
          {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
        </Script>
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
