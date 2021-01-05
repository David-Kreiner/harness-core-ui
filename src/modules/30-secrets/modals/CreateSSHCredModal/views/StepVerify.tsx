import React from 'react'
import { StepProps, Container, Text, Color } from '@wings-software/uicore'

import i18n from '../CreateSSHCredModal.i18n'
import VerifyConnection from './VerifyConnection'
import type { SSHCredSharedObj } from '../CreateSSHCredWizard'

interface StepVerifyProps {
  closeModal?: () => void
}

const StepVerify: React.FC<StepProps<SSHCredSharedObj> & StepVerifyProps> = ({ prevStepData, closeModal }) => {
  return (
    <Container padding="small" height={500}>
      <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
        {i18n.stepTitleVerify}
      </Text>
      <VerifyConnection closeModal={closeModal} identifier={prevStepData?.detailsData?.identifier as string} />
    </Container>
  )
}

export default StepVerify
