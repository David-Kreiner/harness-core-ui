import React from 'react'
import cx from 'classnames'
import { Icon, IconName } from '@wings-software/uicore'

import { ExecutionLayoutState, useExecutionLayoutContext } from './ExecutionLayoutContext'

import css from './ExecutionLayout.module.scss'

export interface ExecutionLayoutToggleProps {
  className?: string
}

const iconNameMap: Record<ExecutionLayoutState, IconName> = {
  [ExecutionLayoutState.NONE]: 'airplane',
  [ExecutionLayoutState.BOTTOM]: 'layout-bottom',
  [ExecutionLayoutState.FLOATING]: 'layout-float',
  [ExecutionLayoutState.RIGHT]: 'layout-right'
}

export default function ExecutionLayoutToggle(props: ExecutionLayoutToggleProps): React.ReactElement {
  const { layout, setLayout } = useExecutionLayoutContext()

  function handleViewChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const newLayout = e.target.value
    setLayout(newLayout as ExecutionLayoutState)
  }

  return (
    <div className={cx(css.toggle, props.className)}>
      {[ExecutionLayoutState.RIGHT, ExecutionLayoutState.BOTTOM, ExecutionLayoutState.FLOATING].map(key => (
        <label key={key} className={css.label} title={'Align ' + key.toLowerCase()}>
          <input type="radio" name="layout" value={key} onChange={handleViewChange} checked={layout === key} />
          <Icon name={iconNameMap[key]} />
        </label>
      ))}
    </div>
  )
}
