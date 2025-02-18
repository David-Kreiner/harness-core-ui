/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepProps, Container, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import VerifyConnection from './VerifyConnection'
import type { SSHCredSharedObj } from '../CreateSSHCredWizard'

interface StepVerifyProps {
  closeModal?: () => void
}

const StepVerify: React.FC<StepProps<SSHCredSharedObj> & StepVerifyProps> = ({ prevStepData, closeModal }) => {
  const { getString } = useStrings()
  return (
    <Container padding="small" height={500}>
      <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
        {getString('secrets.stepTitleVerify')}
      </Text>
      <VerifyConnection
        closeModal={closeModal}
        identifier={prevStepData?.detailsData?.identifier as string}
        showFinishBtn={true}
      />
    </Container>
  )
}

export default StepVerify
