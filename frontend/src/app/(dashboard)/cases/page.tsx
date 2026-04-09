import { PageHeader } from '@/components/layout/page-header';
import { CaseTable } from '@/components/cases/case-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CasesPage() {
  return (
    <div>
      <PageHeader
        title="Cases"
        description="All active and recent cases."
        action={
          <Button asChild size="sm">
            <Link href="/cases/new">New Case</Link>
          </Button>
        }
      />
      <CaseTable />
    </div>
  );
}
