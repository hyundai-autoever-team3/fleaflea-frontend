import { Modal } from '../../../shared/ui/modal'
import { InviteLinkContent } from './InviteLinkContent'

interface InviteLinkModalProps {
  open: boolean
  marketTitle: string
  inviteCode: string
  onClose: () => void
}

export function InviteLinkModal({ open, marketTitle, inviteCode, onClose }: InviteLinkModalProps) {
  return (
    <Modal open={open} onRequestClose={onClose} labelledBy="invite-link-title">
      <InviteLinkContent titleId="invite-link-title" marketTitle={marketTitle} inviteCode={inviteCode} />
    </Modal>
  )
}
