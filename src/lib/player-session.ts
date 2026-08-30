import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export const PLAYER_ID_COOKIE = 'aata_player_id';

export function getPlayerIdentifier(req: NextRequest): { anonymousPlayerId: string } {
  const headerId = req.headers.get('x-player-id');
  if (headerId) {
    return { anonymousPlayerId: headerId };
  }

  const cookieId = req.cookies.get(PLAYER_ID_COOKIE)?.value;
  if (cookieId) {
    return { anonymousPlayerId: cookieId };
  }

  return { anonymousPlayerId: `anon_${nanoid(12)}` };
}
