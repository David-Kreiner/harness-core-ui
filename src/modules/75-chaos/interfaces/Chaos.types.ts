/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type { Diagnostic } from 'vscode-languageserver-types'
import type { ConnectorReferenceFieldProps } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import type { OverviewChartsWithToggleProps } from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'
import type { NavigationCheckProps } from '@common/components/NavigationCheck/NavigationCheck'
import type {
  UseCreateConnectorModalProps,
  UseCreateConnectorModalReturn
} from '@connectors/modals/ConnectorModal/useCreateConnectorModal'

export interface ChaosCustomMicroFrontendProps {
  customComponents: {
    ConnectorReferenceField: React.ComponentType<ConnectorReferenceFieldProps>
    OverviewChartsWithToggle: React.ComponentType<OverviewChartsWithToggleProps>
    NavigationCheck: React.ComponentType<NavigationCheckProps>
  }
  customHooks: {
    useCreateConnectorModal: (props: UseCreateConnectorModalProps) => UseCreateConnectorModalReturn
  }
  customFunctions: {
    validateYAMLWithSchema: (yamlString: string, schema: Record<string, any>) => Promise<Diagnostic[]>
  }
}

export interface ChaosExperiment {
  id: string
  name: string
}

export interface PipelineExperimentSelectProps {
  onSelect: (experiment: ChaosExperiment) => void
  goToNewExperiment: () => void
}

export interface ExperimentPreviewProps {
  experimentID: string
}

export interface ChaosStepExecutionProps {
  experimentID: string
  experimentRunID: string | undefined
  status: string
  expectedResilienceScore: number
  isManualInterruption: boolean
  actionButtons: React.ReactElement
}
