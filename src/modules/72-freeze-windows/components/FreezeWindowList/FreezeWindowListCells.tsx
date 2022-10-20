/* eslint-disable react/function-component-definition */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, FontVariation } from '@harness/design-system'
import { Classes, Switch, Menu, Position, PopoverInteractionKind } from '@blueprintjs/core'
import { Button, Layout, Popover, Text, TagsPopover, ButtonVariation, Icon, Checkbox } from '@harness/uicore'
import { Link } from 'react-router-dom'
import type { Cell, CellValue, ColumnInstance, Renderer, Row, TableInstance } from 'react-table'
import React from 'react'
import cx from 'classnames'
import moment from 'moment'
import { useStrings } from 'framework/strings'
import { getReadableDateTime } from '@common/utils/dateUtils'
import { killEvent } from '@common/utils/eventUtils'
import type { FreezeSummaryResponse, FreezeWindow, UpdateFreezeStatusQueryParams } from 'services/cd-ng'
import { FreezeStatus } from '@freeze-windows/utils/freezeWindowUtils'
import css from './FreezeWindowList.module.scss'

export interface FreezeWindowListColumnActions {
  onRowSelectToggle: (data: { freezeWindowId: string; checked: boolean }) => void
  onToggleFreezeRow: (data: { freezeWindowId?: string; status: UpdateFreezeStatusQueryParams['status'] }) => void
  onDeleteRow: (freezeWindowId?: string) => void
  onViewFreezeRow: (freezeWindow: FreezeSummaryResponse) => void
  getViewFreezeRowLink: (freezeWindow: FreezeSummaryResponse) => string
  selectedItems: string[]
  disabled: boolean
  freezeStatusMap: Record<string, FreezeStatus>
}

type CellTypeWithActions<D extends Record<string, any>, V = any> = TableInstance<D> & {
  column: ColumnInstance<D> & FreezeWindowListColumnActions
  row: Row<D>
  cell: Cell<D, V>
  value: CellValue<V>
}

type CellType = Renderer<CellTypeWithActions<FreezeSummaryResponse>>

export const FreezeNameCell: CellType = ({ row, column }) => {
  const data = row.original
  const { getString } = useStrings()

  return (
    <Layout.Vertical>
      <Layout.Horizontal
        spacing="small"
        flex={{ alignItems: 'center', justifyContent: 'start' }}
        margin={{ bottom: 'small' }}
      >
        <Link to={column.getViewFreezeRowLink(data)}>
          <Text font={{ variation: FontVariation.LEAD }} color={Color.PRIMARY_7} lineClamp={1}>
            {data.name}
          </Text>
        </Link>

        {data.description && (
          <Popover className={Classes.DARK} position={Position.TOP} interactionKind={PopoverInteractionKind.HOVER}>
            <Icon name="description" width={16} height={20} />
            <Layout.Vertical spacing="medium" padding="medium" style={{ maxWidth: 400 }}>
              <Text color={Color.GREY_200} font={{ variation: FontVariation.SMALL_SEMI }}>
                Description
              </Text>
              <Text color={Color.WHITE} font={{ variation: FontVariation.SMALL }}>
                {data.description}
              </Text>
            </Layout.Vertical>
          </Popover>
        )}

        {data.tags && Object.keys(data.tags || {}).length ? (
          <TagsPopover
            tags={data.tags}
            iconProps={{ size: 14, color: Color.GREY_600 }}
            popoverProps={{ className: Classes.DARK }}
            className={css.tags}
          />
        ) : null}
      </Layout.Horizontal>

      <Text color={Color.GREY_600} font="small" lineClamp={1}>
        {getString('idLabel', { id: data.identifier })}
      </Text>
    </Layout.Vertical>
  )
}

export const FreezeTimeCell: CellType = ({ row }) => {
  const data = row.original
  const freezeWindow = data.windows?.[0] || ({} as FreezeWindow)
  const { startTime, duration, endTime, timeZone, recurrence } = freezeWindow
  return (
    <Layout.Vertical spacing="small">
      <Layout.Horizontal>
        <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_900}>
          {moment(startTime).format('lll')}
        </Text>
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_900}>
          &nbsp;{duration ? 'for' : 'to'}
        </Text>
        <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_900}>
          &nbsp;{duration || moment(endTime).format('lll')}
        </Text>
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
          &nbsp;{timeZone}
        </Text>
      </Layout.Horizontal>

      {recurrence && (
        <Text color={Color.GREY_900} font={{ variation: FontVariation.SMALL }}>
          {recurrence?.type}
          {freezeWindow?.recurrence?.spec?.until && ` until ${freezeWindow?.recurrence?.spec?.until}`}
        </Text>
      )}
    </Layout.Vertical>
  )
}

export const StatusCell: CellType = ({ row, column }) => {
  const { getString } = useStrings()
  const data = row.original
  const status = column.freezeStatusMap[data.identifier!]

  return (
    <Text
      font={{ variation: FontVariation.TINY_SEMI }}
      color={status === FreezeStatus.ACTIVE ? Color.PRIMARY_7 : Color.GREY_700}
      className={cx(css.status, status === FreezeStatus.ACTIVE ? css.active : css.inactive)}
    >
      {status || getString('inactive')}
    </Text>
  )
}

export const LastModifiedCell: CellType = ({ row }) => {
  const data = row.original
  return (
    <Text color={Color.GREY_900} font={{ size: 'small' }}>
      {getReadableDateTime(data.lastUpdatedAt)}
    </Text>
  )
}

export const MenuCell: CellType = ({ row, column }) => {
  const data = row.original
  const disabled = column.disabled

  return (
    <Layout.Horizontal style={{ justifyContent: 'flex-end' }} onClick={killEvent}>
      <Popover className={Classes.DARK} position={Position.LEFT}>
        <Button variation={ButtonVariation.ICON} icon="Options" aria-label="Freeze window menu actions" />
        <Menu style={{ backgroundColor: 'unset', minWidth: 'unset' }}>
          <Menu.Item
            className={css.link}
            text={<Link to={column.getViewFreezeRowLink(data)}>{disabled ? 'View' : 'Edit'}</Link>}
          />
          <Menu.Item
            disabled={disabled}
            text={data.status === 'Disabled' ? 'Enable' : 'Disable'}
            onClick={() => {
              column.onToggleFreezeRow({
                freezeWindowId: data.identifier!,
                status: data.status === 'Disabled' ? 'Enabled' : 'Disabled'
              })
            }}
          />
          <Menu.Item disabled={disabled} text="Delete" onClick={() => column.onDeleteRow(data.identifier!)} />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

export const RowSelectCell: CellType = ({ row, column }) => {
  const data = row.original

  return (
    <div className={css.checkbox} onClick={killEvent}>
      <Checkbox
        disabled={column.disabled}
        large
        checked={column.selectedItems.includes(data.identifier!)}
        onChange={event => {
          column.onRowSelectToggle({ freezeWindowId: data.identifier!, checked: event.currentTarget.checked })
        }}
      />
    </div>
  )
}

export const FreezeToggleCell: CellType = ({ row, column }) => {
  const data = row.original

  return (
    <div onClick={killEvent}>
      <Switch
        disabled={column.disabled}
        aria-label="Toggle freeze"
        onChange={event =>
          column.onToggleFreezeRow({
            freezeWindowId: data.identifier!,
            status: event.currentTarget.checked ? 'Enabled' : 'Disabled'
          })
        }
        className={css.switch}
        checked={data.status === 'Enabled'}
      />
    </div>
  )
}
