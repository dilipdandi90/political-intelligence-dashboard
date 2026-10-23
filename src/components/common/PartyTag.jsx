import { partyColor, partyName } from '../../utils/parties'

export function PartyTag({ party }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap" title={partyName(party)}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: partyColor(party) }} aria-hidden="true" />
      {party}
    </span>
  )
}
