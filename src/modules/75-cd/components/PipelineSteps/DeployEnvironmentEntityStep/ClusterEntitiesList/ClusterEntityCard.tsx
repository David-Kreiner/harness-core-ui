/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { ButtonVariation, Card, Text, Color, Container, Layout, Button } from '@harness/uicore'

import { useStrings } from 'framework/strings'

import type { ClusterData } from '../types'

import css from './ClusterEntitiesList.module.scss'

export interface ClusterEntityCardProps extends ClusterData {
  readonly: boolean
  onDeleteClick: (cluster: ClusterData) => void
}

export function ClusterEntityCard({
  name,
  clusterRef,
  readonly,
  onDeleteClick
}: ClusterEntityCardProps): React.ReactElement {
  const { getString } = useStrings()

  return (
    <Card className={css.card}>
      <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Layout.Vertical>
          <Layout.Horizontal
            flex={{ justifyContent: 'flex-start', alignItems: 'flex-end' }}
            spacing="small"
            margin={{ bottom: 'xsmall' }}
          >
            <Text color={Color.PRIMARY_7}>{name}</Text>
          </Layout.Horizontal>

          <Text color={Color.GREY_500} font={{ size: 'small' }} lineClamp={1}>
            {getString('common.ID')}: {clusterRef}
          </Text>
        </Layout.Vertical>

        <Container>
          <Button
            variation={ButtonVariation.ICON}
            icon="remove-minus"
            data-testid={`delete-cluster-${clusterRef}`}
            disabled={readonly}
            onClick={() => onDeleteClick({ name, clusterRef })}
          />
        </Container>
      </Layout.Horizontal>
    </Card>
  )
}
