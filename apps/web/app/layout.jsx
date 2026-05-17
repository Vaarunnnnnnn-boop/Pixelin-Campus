import "./global.css";
import AssistantWidget from "./components/AssistantWidget";

export const metadata = { title: "Pixelin" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}