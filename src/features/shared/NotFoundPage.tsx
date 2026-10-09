import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/Feedback';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass aria-hidden="true" className="size-6" />}
      title="That page does not exist"
      description="The link may be out of date. Head back to your library to keep studying."
      actions={
        <Link to="/" className="btn btn-primary">
          Go to Library
        </Link>
      }
    />
  );
}
