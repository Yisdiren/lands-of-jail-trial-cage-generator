import './globals.css';

export const metadata = {
  title: 'Lands of Jail Trial Cage Generator',
  description: 'Trial Cage formation generator for Lands of Jail',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
