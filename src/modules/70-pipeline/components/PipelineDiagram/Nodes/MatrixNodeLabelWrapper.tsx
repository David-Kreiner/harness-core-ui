/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, Icon, Layout, Text } from '@harness/uicore'
import React from 'react'
import cx from 'classnames'
import { isMultiSvcOrMultiEnv } from '@pipeline/utils/executionUtils'
import css from './MatrixNodeLabelWrapper.module.scss'

export interface MatrixNodeLabelWrapperProps {
  nodeType: string
  isParallelNode?: boolean
  subType?: string
}

export default function MatrixNodeLabelWrapper({
  nodeType,
  isParallelNode,
  subType
}: MatrixNodeLabelWrapperProps): JSX.Element {
  const isMultiSvcEnv = isMultiSvcOrMultiEnv(subType)
  return (
    <Layout.Horizontal
      className={cx(css.matrixLabel, {
        [css.marginTop]: isParallelNode,
        [css.multiSvcEnv]: isMultiSvcEnv
      })}
    >
      <Icon size={16} name="looping" style={{ marginRight: '5px' }} color={Color.WHITE} />
      <Text color={Color.WHITE} font="small" style={{ paddingRight: '5px' }}>
        {nodeType}
      </Text>
    </Layout.Horizontal>
  )
}
