import './globals.css'

export const metadata = {
  title: 'k6 Load Test Launcher',
  description: 'Launch k6 load tests with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

