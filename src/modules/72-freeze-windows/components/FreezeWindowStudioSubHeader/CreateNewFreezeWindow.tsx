/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { Button, ButtonVariation, Container, Formik, FormikForm, Layout } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { NameIdDescriptionTags } from '@common/components'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { getInitialValues } from '@freeze-windows/utils/FreezeWindowStudioUtil'
import type { WindowPathProps } from '@freeze-windows/types'
import { DefaultFreezeId } from '@freeze-windows/context/FreezeWindowReducer'
import css from './FreezeWindowStudioSubHeader.module.scss'

interface CreateNewFreezeWindowProps {
  onClose: (identifier?: string) => void
  updateFreeze: (response: any) => void
  freezeObj: any
}

export const CreateNewFreezeWindow: React.FC<CreateNewFreezeWindowProps> = ({ onClose, updateFreeze, freezeObj }) => {
  const { getString } = useStrings()
  const { windowIdentifier } = useParams<WindowPathProps>()
  const [initialValues, setInitialValues] = React.useState(
    /* istanbul ignore next */ isEmpty(freezeObj) ? { identifier: '' } : getInitialValues(freezeObj)
  )

  React.useEffect(() => {
    setInitialValues(getInitialValues(freezeObj))
  }, [freezeObj.identifier, freezeObj.name, freezeObj.description, freezeObj.tags])

  const onSubmit = /* istanbul ignore next */ (values: any) => {
    updateFreeze({ ...values })
    onClose(values.identifier)
  }

  const onCancel = React.useCallback(() => onClose(), [])

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={onSubmit}
      formName="createNewFreezeWindow"
      validationSchema={Yup.object().shape({
        name: NameSchema(),
        identifier: IdentifierSchema()
      })}
    >
      {formikProps => {
        return (
          <FormikForm className={css.createNewFreezeForm}>
            <Container padding={{ top: 'small', right: 'xxlarge', bottom: 'xxlarge', left: 'xxlarge' }}>
              <NameIdDescriptionTags
                formikProps={formikProps}
                identifierProps={{
                  inputLabel: getString('name'),
                  isIdentifierEditable: windowIdentifier === DefaultFreezeId,
                  inputGroupProps: { inputGroup: { autoFocus: true } }
                }}
              />
              <Layout.Horizontal spacing="small" margin={{ top: 'xxlarge' }}>
                <Button
                  type="submit"
                  variation={ButtonVariation.PRIMARY}
                  text={getString(
                    /* istanbul ignore next */
                    freezeObj?.identifier && freezeObj.identifier !== DefaultFreezeId ? 'continue' : 'start'
                  )}
                />
                <Button onClick={onCancel} variation={ButtonVariation.SECONDARY} text={getString('cancel')} />
              </Layout.Horizontal>
            </Container>
          </FormikForm>
        )
      }}
    </Formik>
  )
}
