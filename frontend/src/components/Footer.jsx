export default function Footer() {
  return (
    <footer className="mt-16 bg-ink px-6 py-8 text-sm text-white/60">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2">
        <span>University of Peradeniya - Peradeniya 20400 - Alumni Relations Office</span>
        <span>© {new Date().getFullYear()} University of Peradeniya</span>
      </div>
    </footer>
  )
}
