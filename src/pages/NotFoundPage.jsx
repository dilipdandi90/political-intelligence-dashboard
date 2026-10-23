import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found">
        <p>That section doesn&apos;t exist.</p>
      </PageHeader>
      <Link className="inline-flex min-h-9.5 items-center rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white no-underline hover:bg-brand-strong" to="/">
        Back to overview
      </Link>
    </>
  )
}
