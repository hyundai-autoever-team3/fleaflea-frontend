// Semi-public route (/invite/:code) — reachable while logged out. Branches on session
// state itself instead of using RequireAuth/RequireGuest: show a market preview + login
// prompt when logged out, or the join confirmation when logged in.
export function MarketJoinPage() {
  return <div>Market Join</div>
}
