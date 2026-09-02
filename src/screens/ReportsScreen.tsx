import { Button, Card, PageHeader } from '../components/ui'
import { reportTypes } from '../data/civic'

export default function ReportsScreen() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Generate governed, exportable documents." />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="text-sm font-medium">{report}</div>
            <Button className="h-[34px] shrink-0 px-3.5 text-[13px]">Generate</Button>
          </Card>
        ))}
      </div>
    </>
  )
}
