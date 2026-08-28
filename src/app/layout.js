
import ContextProvider from "@/component/helper/Context";
import { Toaster } from "react-hot-toast";
import "./globals.css";


export const metadata = {
  title:'Disibin',
  description: "Main home page",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={` scroll-smooth antialiased bg-gray-100 w-full`}>
        <ContextProvider>
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerStyle={{ zIndex: 99999 }}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
          <main>{children}</main>
        </ContextProvider>
      </body>
    </html>
  );
}
