/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'
import { FreezeWindowContext } from '@freeze-windows/components/FreezeWindowStudio/FreezeWindowContext/FreezeWindowContext'
import type { ResourcesInterface } from '@freeze-windows/types'
import { FreezeWindowStudioVisualView } from './FreezeWindowStudioVisualView'
import { FreezeWindowStudioYAMLView } from './FreezeWindowStudioYAMLView'
import css from './FreezeWindowStudio.module.scss'

interface FreezeWindowStudioBodyProps {
  error?: any
  resources: ResourcesInterface
}

export const FreezeWindowStudioBody = ({ error, resources }: FreezeWindowStudioBodyProps) => {
  const { view } = React.useContext(FreezeWindowContext)
  if (error) {
    return <div>Error</div>
  }
  const isYaml = view === SelectedView.YAML
  const content = isYaml ? <FreezeWindowStudioYAMLView /> : <FreezeWindowStudioVisualView resources={resources} />

  return <Container className={css.canvasContainer}>{content}</Container>
}
