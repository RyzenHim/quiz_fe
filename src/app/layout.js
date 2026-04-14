import { AppProvider } from "../components/app-provider";
import "./globals.css";

export const metadata = {
  title: "Quiz App",
  description: "Teacher and student quiz management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
