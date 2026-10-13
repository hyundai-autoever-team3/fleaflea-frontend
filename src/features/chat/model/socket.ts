import { Client, ReconnectionTimeMode } from '@stomp/stompjs'
import { isAxiosError } from 'axios'

import type { ChatSocketError, ChatSocketEvent, ChatSocketResult } from '../../../entities/chat'
import { refreshAccessToken, useSessionStore } from '../../../entities/session'
import { env } from '../../../shared/config/env'
import { useChatStore } from './store'

// 서버와 같은 간격(10초)으로 살아 있다는 신호를 주고받는다
const HEARTBEAT = 10_000
const RECONNECT_DELAY = 5_000
const MAX_RECONNECT_DELAY = 60_000
// 토큰 만료가 이만큼 남았으면 연결 전에 미리 새로 받는다
const EXPIRY_MARGIN = 30_000
// 서버가 인증 실패·허용되지 않은 경로로 연결을 끊을 때 쓰는 종료 코드
const POLICY_VIOLATION = 1008

export interface ChatSocketHandlers {
  onEvent: (event: ChatSocketEvent) => void
  onResult: (result: ChatSocketResult) => void
  onError: (error: ChatSocketError) => void
  // 연결될 때마다(재연결 포함) 부른다. 끊긴 동안 놓친 내용을 REST로 다시 맞추는 자리다
  onConnected: () => void
}

let client: Client | null = null
// 마지막으로 연결에 쓴 토큰. 서버가 그 토큰을 거절했는지 판단할 때 비교한다
let usedToken: string | null = null
let rejected = false

// API 주소가 따로 있으면 그 서버로, 없으면 지금 주소로 연결한다(개발 서버의 프록시가 넘겨준다).
// http → ws, https → wss로 바꾸면 되므로 앞의 http만 ws로 갈아 끼운다
function socketUrl() {
  const base = env.apiBaseUrl.replace(/\/$/, '') || window.location.origin

  return `${base.replace(/^http/, 'ws')}/ws/chat`
}

// 토큰 가운데 부분(payload)에 만료 시각(exp, 초 단위)이 들어 있다.
// 읽지 못하면 일단 그대로 쓰고, 서버가 거절하면 그때 새로 받는다
function isExpiringSoon(token: string) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: number }

    return typeof exp === 'number' && exp * 1000 - Date.now() < EXPIRY_MARGIN
  } catch {
    return false
  }
}

function parse<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T
  } catch {
    return null
  }
}

// 연결을 시도할 때마다 불린다. 쓸 수 있는 토큰을 골라 CONNECT 헤더에 싣는다.
// 토큰을 주소에 붙이지 않는 이유는 주소가 서버 기록과 브라우저 기록에 남기 때문이다
async function prepareToken(target: Client) {
  let token = useSessionStore.getState().accessToken

  if (!token) {
    void target.deactivate()
    return
  }

  // 방금 쓴 토큰을 서버가 거절했거나 곧 만료되면 새로 받는다.
  // 다른 요청이 이미 토큰을 바꿔 놓았다면(저장된 값이 달라졌다면) 그 값을 그대로 쓴다
  if (isExpiringSoon(token) || (rejected && token === usedToken)) {
    try {
      token = await refreshAccessToken()
    } catch (error) {
      // 리프레시 토큰까지 만료됐으면 로그인부터 다시 해야 한다
      if (isAxiosError(error) && error.response?.status === 401) {
        useSessionStore.getState().clearSession()
        void target.deactivate()
        return
      }
      // 네트워크 오류 등은 지금 토큰으로 시도하고, 실패하면 다음 재연결에서 다시 받는다
    }
  }

  rejected = false
  usedToken = token
  target.connectHeaders = { Authorization: `Bearer ${token}` }
}

export function connectChatSocket(handlers: ChatSocketHandlers) {
  if (client) return

  const { setStatus } = useChatStore.getState()

  const next: Client = new Client({
    brokerURL: socketUrl(),
    heartbeatIncoming: HEARTBEAT,
    heartbeatOutgoing: HEARTBEAT,
    // 끊기면 5초 뒤부터 다시 시도하고, 계속 실패하면 간격을 두 배씩 늘려 최대 1분까지 벌린다
    reconnectDelay: RECONNECT_DELAY,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: MAX_RECONNECT_DELAY,

    beforeConnect: () => prepareToken(next),

    onConnect: () => {
      // 실시간 이벤트: 새 메시지·읽음·입력 중. 두 사람의 모든 접속 기기에 온다
      next.subscribe('/user/queue/chat', (frame) => {
        const event = parse<ChatSocketEvent>(frame.body)
        if (event) handlers.onEvent(event)
      })
      // 내가 보낸 요청의 결과. 요청을 보낸 이 연결에만 온다
      next.subscribe('/user/queue/chat-acks', (frame) => {
        const result = parse<ChatSocketResult>(frame.body)
        if (result) handlers.onResult(result)
      })
      next.subscribe('/user/queue/chat-errors', (frame) => {
        const error = parse<ChatSocketError>(frame.body)
        if (error) handlers.onError(error)
      })

      setStatus('connected')
      handlers.onConnected()
    },

    // STOMP ERROR 프레임. 인증 실패가 대표적이라 다음 연결에서 토큰을 새로 받게 한다
    onStompError: () => {
      rejected = true
    },

    onWebSocketClose: (event) => {
      if (event.code === POLICY_VIOLATION) rejected = true
      // deactivate()로 끊은 경우에는 active가 false라 다시 시도하지 않는다
      setStatus(next.active ? 'reconnecting' : 'idle')
    },
  })

  client = next
  setStatus('connecting')
  next.activate()
}

export function disconnectChatSocket() {
  const current = client
  client = null
  usedToken = null
  rejected = false
  useChatStore.getState().reset()

  if (current) void current.deactivate()
}

// 연결돼 있을 때만 보낸다. 보내지 못했으면 false를 돌려줘 호출한 쪽이 실패로 처리한다
export function publishChat(destination: string, body: unknown) {
  if (!client?.connected) return false

  client.publish({
    destination,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  return true
}
