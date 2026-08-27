
import "./globals.css";


export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`w-full h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
