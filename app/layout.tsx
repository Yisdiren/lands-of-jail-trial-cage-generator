import './globals.css';
import FormationIconEnhancer from './FormationIconEnhancer';
import FirstVisitOnboarding from './FirstVisitOnboarding';

export const metadata = {
  title: 'Lands of Jail Trial Cage Generator',
  description: 'Trial Cage formation generator for Lands of Jail',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FirstVisitOnboarding />
        {children}
        <FormationIconEnhancer />
      </body>
    </html>
  );
}
