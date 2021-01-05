import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import type { ConnectorRequestBody, ConnectorInfoDTO, ResponseBoolean } from 'services/cd-ng'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import { Connectors } from '@connectors/constants'
import StepArtifactoryAuthentication from './StepAuth/StepArtifactoryAuthentication'
import i18n from './CreateArtifactoryConnector.i18n'

interface CreateArtifactoryConnectorProps {
  hideLightModal: () => void
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  mock?: ResponseBoolean
}
const CreateArtifactoryConnector: React.FC<CreateArtifactoryConnectorProps> = props => {
  return (
    <>
      <StepWizard<ConnectorInfoDTO>>
        <ConnectorDetailsStep type={Connectors.ARTIFACTORY} name={i18n.STEP_ONE.NAME} mock={props.mock} />
        <StepArtifactoryAuthentication name={i18n.STEP_TWO.NAME} onConnectorCreated={props.onConnectorCreated} />
        <VerifyOutOfClusterDelegate
          name={i18n.STEP_THREE.NAME}
          renderInModal={true}
          onSuccess={props.onConnectorCreated}
          isLastStep={true}
          type={Connectors.ARTIFACTORY}
          hideLightModal={props.hideLightModal}
        />
      </StepWizard>
    </>
  )
}

export default CreateArtifactoryConnector
