import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { CollectionItemDetail, CollectionItemSummary } from '../model/types'

const LIST_SIZE = 100

// 페이지 키는 mine·owner 키 뒤에 이어 붙여, 물건을 바꾼 뒤 all 키로 무효화하면 함께 새로 받는다
export const collectionKeys = {
  all: ['collection-items'] as const,
  mine: ['collection-items', 'mine'] as const,
  minePage: (page: number, size: number) =>
    [...collectionKeys.mine, 'page', { page, size }] as const,
  owner: (ownerId: number) => [...collectionKeys.all, 'owner', ownerId] as const,
  ownerPage: (ownerId: number, page: number, size: number) =>
    [...collectionKeys.owner(ownerId), 'page', { page, size }] as const,
  detail: (collectionItemId: number) =>
    [...collectionKeys.all, 'detail', collectionItemId] as const,
}

const isValidId = (id: number) => Number.isInteger(id) && id > 0

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 401 || status === 403 || status === 404) return false

  return failureCount < 3
}

export function getMyCollectionItems(page = 0, size = LIST_SIZE, signal?: AbortSignal) {
  return api.get<PageResponse<CollectionItemSummary>>('/api/v1/members/me/collection-items', {
    params: { page, size },
    signal,
  })
}

export function getOwnerCollectionItems(
  ownerId: number,
  page = 0,
  size = LIST_SIZE,
  signal?: AbortSignal,
) {
  return api.get<PageResponse<CollectionItemSummary>>(
    `/api/v1/members/${ownerId}/collection-items`,
    {
      params: { page, size },
      signal,
    },
  )
}

// 도감 화면은 전체 목록을 사용하므로 서버의 모든 페이지를 합친다.
async function getAllCollectionItems(
  getPage: (page: number) => Promise<PageResponse<CollectionItemSummary>>,
) {
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
    queryFn: ({ signal }) =>
      getAllCollectionItems(
        async (page) => (await getMyCollectionItems(page, LIST_SIZE, signal)).data,
      ),
    retry: retryUnlessClientError,
  })
}

// 도감 화면용. 보이는 한 페이지만 받고, 다음 페이지가 올 때까지 이전 페이지를 그대로 보여준다
export function useMyCollectionItemPage(page: number, size: number) {
  return useQuery({
    queryKey: collectionKeys.minePage(page, size),
    queryFn: async ({ signal }) => (await getMyCollectionItems(page, size, signal)).data,
    retry: retryUnlessClientError,
    placeholderData: keepPreviousData,
  })
}

export function useOwnerCollectionItemPage(ownerId: number, page: number, size: number) {
  return useQuery({
    queryKey: collectionKeys.ownerPage(ownerId, page, size),
    queryFn: async ({ signal }) =>
      (await getOwnerCollectionItems(ownerId, page, size, signal)).data,
    enabled: isValidId(ownerId),
    retry: retryUnlessClientError,
    placeholderData: keepPreviousData,
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
