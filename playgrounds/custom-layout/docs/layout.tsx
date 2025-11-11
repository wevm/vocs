export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="custom_fullwidth">{children}</div>
}

export function TopNavEnd() {
  return <div>{import.meta.env.VITE_TOP_NAV_END}</div>
}
