/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { CollapseList, CollapseListPanel, IconName, Text, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { IProps } from '@blueprintjs/core'
import css from './ArtifactsComponent.module.scss'

export type ArtifactType = 'File' | 'Image'

export interface Artifact {
  url: string
  type: ArtifactType
  image?: string
  tag?: string
}

export interface ArtifactGroup {
  name: string
  icon: IconName
  artifacts: Artifact[]
}

export interface ArtifactsComponentProps extends IProps {
  artifactGroups: ArtifactGroup[]
}

function ArtifactsComponent(props: ArtifactsComponentProps): React.ReactElement {
  const { artifactGroups, className } = props
  return (
    <div className={cx(css.main, className)}>
      {artifactGroups.map((artifactGroup, idx) => (
        <CollapseList key={idx}>
          <CollapseListPanel
            collapseHeaderProps={{
              heading: (
                <Text color={Color.GREY_900} font={{ weight: 'semi-bold', size: 'normal' }} className={css.heading}>
                  <Icon name={artifactGroup.icon} color={Color.BLUE_500} size={20} />
                  {artifactGroup.name}
                </Text>
              ),
              collapsedIcon: 'main-chevron-right',
              expandedIcon: 'main-chevron-down'
            }}
            isOpen={true}
            footerContent={<div />}
          >
            <>
              {artifactGroup.artifacts.map(({ url, type, image, tag }, itemIdx) => {
                return (
                  <div key={itemIdx} className={css.listItem}>
                    <a className={css.artifactUrl} href={url} target="_blank" rel="noreferrer">
                      {type === 'File' ? url : `${image}: ${tag}`}
                    </a>
                    {type !== 'Image' && (
                      <a href={url} download>
                        <Icon name={'import'} />
                      </a>
                    )}
                  </div>
                )
              })}
            </>
          </CollapseListPanel>
        </CollapseList>
      ))}
    </div>
  )
}

export default ArtifactsComponent
