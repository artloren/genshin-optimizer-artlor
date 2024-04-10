import {
  CardThemed,
  ImgIcon,
  ModalWrapper,
  SqBadge,
} from '@genshin-optimizer/common/ui'
import { useDatabase } from '@genshin-optimizer/gi/db-ui'
import {
  DataContext,
  NodeFieldDisplayText,
  getDisplayHeader,
  getDisplaySections,
} from '@genshin-optimizer/gi/ui'
import { resolveInfo, type NodeDisplay } from '@genshin-optimizer/gi/uidata'
import type { DisplaySub } from '@genshin-optimizer/gi/wr'
import { Masonry } from '@mui/lab'
import {
  CardContent,
  CardHeader,
  Divider,
  MenuItem,
  MenuList,
} from '@mui/material'
import { useContext, useMemo } from 'react'

export interface TargetSelectorModalProps {
  show: boolean
  onClose: () => void
  setTarget: (target: string[], multi?: number) => void
  showEmptyTargets?: boolean
  flatOnly?: boolean
  excludeSections?: string[]
  excludeHeal?: boolean
}
export function TargetSelectorModal({
  show,
  onClose,
  setTarget,
  showEmptyTargets = false,
  flatOnly = false,
  excludeSections = [],
  excludeHeal = false,
}: TargetSelectorModalProps) {
  const { data } = useContext(DataContext)

  const sections = useMemo(() => {
    return (
      getDisplaySections(data)
        .filter(([key]) => !excludeSections.includes(key))
        .map(
          ([key, sectionObj]) =>
            [
              key,
              Object.fromEntries(
                Object.entries(sectionObj).filter(([_sectionKey, node]) => {
                  const { unit, variant } = resolveInfo(node.info)
                  if (flatOnly && unit === '%') return false

                  if (excludeHeal && variant === 'heal') return false

                  if (!showEmptyTargets && node.isEmpty) return false
                  return true
                })
              ) as DisplaySub<NodeDisplay>,
            ] as [string, DisplaySub<NodeDisplay>]
        )
        // Determine if a section has all empty entries
        .filter(([_key, sectionObj]) => Object.keys(sectionObj).length)
    )
  }, [data, excludeSections, flatOnly, showEmptyTargets, excludeHeal])

  return (
    <ModalWrapper open={show} onClose={onClose}>
      <CardThemed>
        <CardContent>
          <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={1}>
            {sections.map(([key, Nodes]) => (
              <SelectorSection
                key={key}
                displayNs={Nodes}
                sectionKey={key}
                setTarget={setTarget}
              />
            ))}
          </Masonry>
        </CardContent>
      </CardThemed>
    </ModalWrapper>
  )
}
function SelectorSection({
  displayNs,
  sectionKey,
  setTarget,
}: {
  displayNs: DisplaySub<NodeDisplay>
  sectionKey: string
  setTarget: (target: string[], multi?: number) => void
  flatOnly?: boolean
}) {
  const { data } = useContext(DataContext)
  const database = useDatabase()
  const header = useMemo(
    () => getDisplayHeader(data, sectionKey, database),
    [data, sectionKey, database]
  )
  return (
    <CardThemed bgt="light" key={sectionKey as string}>
      {header && (
        <CardHeader
          avatar={header.icon && <ImgIcon size={2} src={header.icon} />}
          title={header.title}
          action={header.action && <SqBadge>{header.action}</SqBadge>}
          titleTypographyProps={{ variant: 'subtitle1' }}
        />
      )}
      <Divider />
      <MenuList>
        {Object.entries(displayNs).map(([key, n]) => (
          <TargetSelectorMenuItem
            key={key}
            node={n}
            onClick={() => setTarget([sectionKey, key], n.info.multi)}
          />
        ))}
      </MenuList>
    </CardThemed>
  )
}

function TargetSelectorMenuItem({
  node,
  onClick,
}: {
  node: NodeDisplay
  onClick: () => void
}) {
  return (
    <MenuItem onClick={onClick} style={{ whiteSpace: 'normal' }}>
      <NodeFieldDisplayText node={node} />
    </MenuItem>
  )
}