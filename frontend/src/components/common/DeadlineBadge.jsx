import Badge from '../ui/Badge'

export default function DeadlineBadge({
  deadline,
  status,
  submittedAt,
  tglSelesai,
  compact = false,
}) {
  if (!deadline || deadline === '-') {
    return <span className="text-gray-400 text-xs italic">-</span>
  }

  const cleanDeadline = String(deadline).split(' ')[0]
  const [dYear, dMonth, dDay] = cleanDeadline.split('-').map(Number)
  if (!dYear || !dMonth || !dDay) {
    return <span className="font-mono text-xs">{deadline}</span>
  }

  const deadlineDate = new Date(dYear, dMonth - 1, dDay)
  deadlineDate.setHours(0, 0, 0, 0)

  // Status check: completed or approved
  const isFinished = ['completed', 'approved'].includes(status)

  let badge = null

  // Indikator sisa waktu hanya untuk tugas yang sedang berjalan (belum selesai)
  if (!isFinished) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      badge = (
        <Badge size="sm" color="error" className="font-semibold text-[11px] animate-pulse">
          Lewat {diffDays} hr
        </Badge>
      )
    } else if (diffDays === 0) {
      badge = (
        <Badge size="sm" color="warning" className="font-semibold text-[11px]">
          Hari Ini
        </Badge>
      )
    } else {
      const remainingDays = Math.abs(diffDays)
      if (remainingDays <= 2) {
        badge = (
          <Badge size="sm" color="warning" className="text-[11px]">
            Sisa {remainingDays} hr
          </Badge>
        )
      } else {
        badge = (
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            ({remainingDays} hr lagi)
          </span>
        )
      }
    }
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{cleanDeadline}</span>
        {badge}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-200">
        {cleanDeadline}
      </span>
      {badge}
    </div>
  )
}
