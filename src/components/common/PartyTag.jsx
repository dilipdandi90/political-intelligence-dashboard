import { partyColor, partyName } from '../../utils/parties'

export function PartyTag({ party }) {
  return (
    <span className="party-tag" title={partyName(party)}>
      <span className="party-tag__dot" style={{ background: partyColor(party) }} aria-hidden="true" />
      {party}
    </span>
  )
}
