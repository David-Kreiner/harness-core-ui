/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import COCreateGatewayContainer from '@ce/components/COCreateGateway/COCreateGateway'
import { useStrings } from 'framework/strings'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'

export const CECOCreateGatewayPage: React.FC = () => {
  const { getString } = useStrings()
  useDocumentTitle(getString('ce.co.createAsRule'))
  return <COCreateGatewayContainer />
}

export default CECOCreateGatewayPage
