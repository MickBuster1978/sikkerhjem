import "./globals.css";

export const metadata = {
  title: "HjemKørt — Du kører til festen. Vi kører dig hjem. I din egen bil.",
  description:
    "Book en verificeret chauffør, der henter dig, dine gæster og din bil — og kører jer sikkert hjem, når du vil. Fast pris, intet taxameter. Trekantområdet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="da">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
