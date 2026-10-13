import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-5xl font-bold text-maroon">404</h1>
      <p className="mt-4 text-gray-600">We couldn't find the page you were looking for.</p>
      <Link to="/" className="btn-primary mt-8">
        Back to Home
      </Link>
    </section>
  )
}
