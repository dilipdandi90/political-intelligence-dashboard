import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found">
        <p>That section doesn&apos;t exist.</p>
      </PageHeader>
      <Link className="btn btn--primary" to="/">
        Back to overview
      </Link>
    </>
  )
}
