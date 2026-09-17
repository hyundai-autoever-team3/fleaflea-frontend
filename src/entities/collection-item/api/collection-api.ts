import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { CollectionItemDetail, CollectionItemSummary } from '../model/types'

const LIST_SIZE = 100

export const collectionKeys = {
  all: ['collection-items'] as const,
  mine: ['collection-items', 'mine'] as const,
  owner: (ownerId: number) => [...collectionKeys.all, 'owner', ownerId] as const,
  detail: (collectionItemId: number) => [...collectionKeys.all, 'detail', collectionItemId] as const,
}

const isValidId = (id: number) => Number.isInteger(id) && id > 0

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

export function getMyCollectionItems(page = 0, signal?: AbortSignal) {
  return api.get<PageResponse<CollectionItemSummary>>('/api/v1/members/me/collection-items', {
    params: { page, size: LIST_SIZE },
    signal,
  })
}

export function getOwnerCollectionItems(ownerId: number, page = 0, signal?: AbortSignal) {
  return api.get<PageResponse<CollectionItemSummary>>(`/api/v1/members/${ownerId}/collection-items`, {
    params: { page, size: LIST_SIZE },
    signal,
  })
}

// 첫 100개 이후의 항목도 가져와 목록과 공개/비공개 합계가 일치하게 한다.
async function getAllCollectionItems(getPage: (page: number) => Promise<PageResponse<CollectionItemSummary>>) {
  const firstPage = await getPage(0)
  const items = [...firstPage.content]

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    items.push(...(await getPage(page)).content)
  }

  return items
}

export function useMyCollectionItems() {
  return useQuery({
    queryKey: collectionKeys.mine,
    queryFn: ({ signal }) => getAllCollectionItems(async (page) => (await getMyCollectionItems(page, signal)).data),
    retry: retryUnlessClientError,
  })
}

export function useOwnerCollectionItems(ownerId: number) {
  return useQuery({
    queryKey: collectionKeys.owner(ownerId),
    queryFn: ({ signal }) => getAllCollectionItems(async (page) => (await getOwnerCollectionItems(ownerId, page, signal)).data),
    enabled: isValidId(ownerId),
    retry: retryUnlessClientError,
  })
}

export function getCollectionItem(collectionItemId: number, signal?: AbortSignal) {
  return api.get<CollectionItemDetail>(`/api/v1/collection-items/${collectionItemId}`, { signal })
}

export function useCollectionItem(collectionItemId: number) {
  return useQuery({
    queryKey: collectionKeys.detail(collectionItemId),
    queryFn: async ({ signal }) => (await getCollectionItem(collectionItemId, signal)).data,
    enabled: isValidId(collectionItemId),
    retry: retryUnlessClientError,
  })
}
