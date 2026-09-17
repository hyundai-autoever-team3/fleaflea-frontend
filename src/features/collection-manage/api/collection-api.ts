import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { collectionKeys, type CollectionItemDetail } from '../../../entities/collection-item'
import { api } from '../../../shared/api/axios'

export interface CollectionItemPayload {
  title: string
  description: string
  isPublic: boolean
  image: File | null
}

function toFormData({ title, description, isPublic, image }: CollectionItemPayload) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('description', description)
  formData.append('isPublic', String(isPublic))
  if (image) formData.append('image', image)
  return formData
}

export function createCollectionItem(payload: CollectionItemPayload) {
  return api.post<CollectionItemDetail>('/collection-items', toFormData(payload))
}

// 새 사진을 보내지 않으면 기존 사진을 유지한다.
export function updateCollectionItem(collectionItemId: number, payload: CollectionItemPayload) {
  return api.patch<CollectionItemDetail>(`/collection-items/${collectionItemId}`, toFormData(payload))
}

export function deleteCollectionItem(collectionItemId: number) {
  return api.delete(`/collection-items/${collectionItemId}`)
}

export function useCreateCollectionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCollectionItem,
    onSuccess: () => {
      // 저장 성공과 목록 새로고침의 성공 여부는 분리한다.
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all }).catch(() => undefined)
    },
  })
}

export function useUpdateCollectionItem(collectionItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CollectionItemPayload) => updateCollectionItem(collectionItemId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all }).catch(() => undefined)
    },
  })
}

export function useDeleteCollectionItem(collectionItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteCollectionItem(collectionItemId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: collectionKeys.detail(collectionItemId), exact: true })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all }).catch(() => undefined)
    },
  })
}

export function getCreateCollectionErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 400:
      return '입력한 물건 정보를 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '물건을 등록할 권한이 없어요.'
    case 413:
      return '사진 용량이 너무 커요. 더 작은 사진을 선택해 주세요.'
    case 415:
      return '지원하지 않는 사진 형식이에요. 다른 사진을 선택해 주세요.'
    default:
      return '물건을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

export function getUpdateCollectionErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 400:
      return '입력한 물건 정보를 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '내가 등록한 물건만 수정할 수 있어요.'
    case 404:
      return '물건을 찾을 수 없어요. 도감 목록을 다시 확인해 주세요.'
    case 413:
      return '사진 용량이 너무 커요. 더 작은 사진을 선택해 주세요.'
    case 415:
      return '지원하지 않는 사진 형식이에요. 다른 사진을 선택해 주세요.'
    default:
      return '물건을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

export function getDeleteCollectionErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '내가 등록한 물건만 삭제할 수 있어요.'
    case 404:
      return '이미 삭제되었거나 찾을 수 없는 물건이에요.'
    default:
      return '물건을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
