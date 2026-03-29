import crypto from 'node:crypto';

interface Party {
  id: string;
  leaderId: string;
  members: string[];
}

const parties = new Map<string, Party>();
const memberToParty = new Map<string, string>();

function getPartyByMember(characterId: string): Party | null {
  const partyId = memberToParty.get(characterId);
  if (!partyId) return null;
  return parties.get(partyId) ?? null;
}

export function inviteToParty(inviterId: string, inviteeId: string) {
  let party = getPartyByMember(inviterId);
  if (!party) {
    party = { id: `party-${crypto.randomUUID()}`, leaderId: inviterId, members: [inviterId] };
    parties.set(party.id, party);
    memberToParty.set(inviterId, party.id);
  }

  if (!party.members.includes(inviteeId)) {
    party.members.push(inviteeId);
    memberToParty.set(inviteeId, party.id);
  }

  return { ok: true, party };
}

export function leaveParty(characterId: string) {
  const party = getPartyByMember(characterId);
  if (!party) return { ok: false, error: 'Not in a party.' };

  party.members = party.members.filter((m) => m !== characterId);
  memberToParty.delete(characterId);

  if (party.members.length === 0) {
    parties.delete(party.id);
    return { ok: true, party: null };
  }

  if (party.leaderId === characterId) {
    party.leaderId = party.members[0];
  }

  return { ok: true, party };
}

export function getParty(characterId: string) {
  return getPartyByMember(characterId);
}
