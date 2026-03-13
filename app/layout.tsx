import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalForms — Formulários Inteligentes para Legalização",
  description: "Crie, personalize e compartilhe formulários para processos de legalização de empresas. Abertura, alteração e baixa.",
  keywords: "formulários, legalização, empresa, abertura, alteração, baixa, contrato social",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FF6100" />
      </head>
      <body>
        {children}
        <footer style={{
          textAlign: "center",
          padding: "16px 20px",
          fontSize: 12,
          color: "#bbb",
          letterSpacing: ".3px",
        }}>
          Desenvolvido por Adilson Rocha
        </footer>
      </body>
    </html>
  );
}
