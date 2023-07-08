/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  ButtonVariation,
  Container,
  FormInput,
  FormikForm,
  Layout,
  Switch,
  Text,
  useToaster
} from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import classNames from 'classnames'
import { useParams } from 'react-router-dom'
import NetworkMap from '@discovery/images/NetworkMap.svg'
import { useStrings } from 'framework/strings'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FormConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/FormConnectorReferenceField'
import List from '@discovery/components/List/List'
import { useCreateAgent } from 'services/servicediscovery'
import NumberedList from '@discovery/components/NumberedList/NumberedList'
import SchedulePanel from '@common/components/SchedulePanel/SchedulePanel'
import css from './CreateDAgent.module.scss'

interface FormValues {
  discoveryAgentName: string
  discoveryNamespace: string
  detectNetworkTrace?: boolean
  blacklistedNamespaces?: string[]
  expression?: string
  duration: number | undefined
  minutes?: number | undefined
  connectorRef: string | undefined
  identifier: string | undefined
}

export interface DrawerProps {
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const CreateDAgent: React.FC<DrawerProps> = /* istanbul ignore next */ ({ setDrawerOpen }) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps & ModulePathParams>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const [isNetworkTraceDetected, setIsNetworkTraceDetected] = useState<boolean>(false)
  const dAgentFormRef = React.useRef<FormikProps<FormValues>>()

  const { mutate: infraMutate } = useCreateAgent({
    queryParams: {
      accountIdentifier: accountId,
      organizationIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier
    }
  })

  const inputValues: FormValues = {
    discoveryAgentName: '',
    discoveryNamespace: '',
    connectorRef: undefined,
    identifier: undefined,
    expression: undefined,
    duration: undefined,
    minutes: 15,
    blacklistedNamespaces: ['kube-node-lease', 'kube-public', 'kube-system'],
    detectNetworkTrace: isNetworkTraceDetected
  }

  const handleSubmit = (): void => {
    if (dAgentFormRef.current) {
      dAgentFormRef.current.validateForm().then(errors => {
        if (Object.keys(errors).length === 0) {
          infraMutate({
            k8sConnectorID: dAgentFormRef.current?.values.connectorRef,
            name: dAgentFormRef.current?.values.discoveryAgentName,
            identity: dAgentFormRef.current?.values.identifier,
            config: {
              data: {
                blacklistedNamespaces: dAgentFormRef.current?.values.blacklistedNamespaces,
                enableNodeAgent: dAgentFormRef.current?.values.detectNetworkTrace,
                cron: {
                  expression: dAgentFormRef.current?.values.expression
                },
                collectionWindowInMin: dAgentFormRef.current?.values.duration
              },
              kubernetes: {
                namespace: dAgentFormRef.current?.values.discoveryNamespace,
                imageRegistry: 'index.docker.io/shovan1995',
                serviceAccount: 'cluster-admin-1'
              }
            }
          })
            .then(() => {
              setDrawerOpen(false)
            })
            .catch(e => showError(e))
        } else {
          Object.values(errors).map(err => showError(err))
        }
      })
    }
  }

  return (
    <>
      <Layout.Horizontal
        width="100%"
        height="60px"
        flex={{ justifyContent: 'space-between' }}
        border={{ bottom: true }}
        padding={'large'}
      >
        <Text font={{ variation: FontVariation.H3, weight: 'semi-bold' }}>
          {getString('discovery.createNewDiscoveryAgent')}
        </Text>
        <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'medium'}>
          <Button
            variation={ButtonVariation.TERTIARY}
            text={getString('cancel')}
            onClick={() => setDrawerOpen(false)}
          />
          <Button
            type="submit"
            variation={ButtonVariation.PRIMARY}
            intent="success"
            text={getString('discovery.createDiscoveryAgent')}
            onClick={() => handleSubmit()}
          />
        </Layout.Horizontal>
      </Layout.Horizontal>
      <Layout.Horizontal width="100%" height="100%">
        <Container background={Color.PRIMARY_BG} className={css.overviewContainer} border={{ right: true }}>
          <Formik<FormValues>
            innerRef={dAgentFormRef as React.Ref<FormikProps<FormValues>>}
            initialValues={inputValues}
            validationSchema={Yup.object().shape({
              discoveryAgentName: Yup.string()
                .trim()
                .matches(/^[^-].*$/, getString('discovery.dAgentValidation.nameStart'))
                .matches(/^.*[^-]$/, getString('discovery.dAgentValidation.nameEnd'))
                .max(50, getString('discovery.dAgentValidation.nameStart'))
                .required(getString('discovery.dAgentValidation.nameRequired')),
              connectorRef: Yup.string().trim().required(getString('discovery.dAgentValidation.connectConnector')),
              discoveryNamespace: Yup.string().trim().required(getString('discovery.dAgentValidation.selectNamespace')),
              duration: Yup.number()
                .min(0, getString('discovery.dAgentValidation.durationMaxMin'))
                .max(60, getString('discovery.dAgentValidation.durationMaxMin'))
                .required(getString('discovery.dAgentValidation.durationRequired')),
              minutes: Yup.number().moreThan(14, getString('discovery.dAgentCronError'))
            })}
            onSubmit={() => void 0}
          >
            {formikProps => {
              return (
                <FormikForm className={css.form}>
                  <Layout.Vertical className={classNames(css.formContainer, css.gap2)} padding="xxlarge" width={'60%'}>
                    <NumberedList
                      index={1}
                      showLine
                      content={
                        <Layout.Vertical width={'900px'}>
                          <Text
                            font={{ variation: FontVariation.H5, weight: 'semi-bold' }}
                            margin={{ bottom: 'large' }}
                          >
                            {getString('discovery.selectAConnector')}
                          </Text>
                          <Text
                            width="100%"
                            font={{ variation: FontVariation.BODY }}
                            margin={{ top: 'medium', bottom: 'large' }}
                          >
                            {getString('discovery.selectAConnectorDescription')}
                          </Text>
                          <Container className={css.boxContainer} background={Color.WHITE} padding="medium">
                            <FormConnectorReferenceField
                              width={400}
                              type={'K8sCluster'}
                              name={'connectorRef'}
                              label={
                                <Text color={Color.BLACK} font={'small'} margin={{ bottom: 'small' }}>
                                  {getString('connectors.selectConnector')}
                                </Text>
                              }
                              accountIdentifier={accountId}
                              projectIdentifier={projectIdentifier}
                              orgIdentifier={orgIdentifier}
                              placeholder={getString('connectors.selectConnector')}
                              tooltipProps={{ dataTooltipId: 'selectNetworkMapConnector' }}
                            />

                            <div data-testid="input" style={{ width: '400px' }}>
                              <FormInput.InputWithIdentifier
                                inputName="discoveryAgentName"
                                idName="identifier"
                                isIdentifierEditable
                                inputLabel={getString('discovery.dAgentName')}
                              />
                              <FormInput.Text
                                name="discoveryNamespace"
                                placeholder={getString('discovery.discoveryNamespacePlaceholder')}
                                label={getString('common.namespace')}
                              />
                            </div>
                          </Container>
                        </Layout.Vertical>
                      }
                    />

                    <NumberedList
                      index={2}
                      margin={{ bottom: 'large' }}
                      content={
                        <Layout.Vertical width={'900px'} className={css.margin2}>
                          <Text
                            font={{ variation: FontVariation.H5, weight: 'semi-bold' }}
                            margin={{ bottom: 'large' }}
                          >
                            {`${getString('discovery.dataCollectionSettings')} ${getString('common.optionalLabel')}`}
                          </Text>
                          <Text
                            width="100%"
                            font={{ variation: FontVariation.BODY }}
                            margin={{ top: 'medium', bottom: 'large' }}
                          >
                            {getString('discovery.dataCollectionSettingsDesc')}
                          </Text>

                          <Container className={css.boxContainer} background={Color.WHITE} padding="medium">
                            <Switch
                              name="detectNetworkTrace"
                              label={getString('discovery.detectNetworkTrace')}
                              font={{ weight: 'semi-bold', size: 'normal' }}
                              color={Color.GREY_900}
                              margin={{ bottom: 'medium' }}
                              onChange={() => setIsNetworkTraceDetected(prev => !prev)}
                              checked={isNetworkTraceDetected}
                            />

                            <FormInput.TagInput
                              name="blacklistedNamespaces"
                              label={`${getString('discovery.blacklistedNamespaces')} ${getString(
                                'common.optionalLabel'
                              )}`}
                              itemFromNewTag={tag => tag}
                              items={[]}
                              tagInputProps={{
                                showClearAllButton: true,
                                allowNewTag: true,
                                showAddTagButton: false
                              }}
                              labelFor={tag => tag as string}
                            />

                            <SchedulePanel renderFormTitle={false} hideSeconds formikProps={formikProps} />

                            <FormInput.Text name="duration" label={getString('discovery.forADurationOf')} />
                          </Container>
                        </Layout.Vertical>
                      }
                    />
                  </Layout.Vertical>
                </FormikForm>
              )
            }}
          </Formik>
        </Container>

        <div className={css.details}>
          <Layout.Vertical
            width="100%"
            padding={{ top: 'xxlarge', left: 'xlarge', right: 'xlarge', bottom: 'xxlarge' }}
          >
            <Layout.Horizontal flex={{ justifyContent: 'space-between' }} margin={{ bottom: 'large' }}>
              <Text font={{ variation: FontVariation.H5, weight: 'semi-bold' }}>{getString('common.networkMap')}</Text>
              <Text
                font={{ variation: FontVariation.SMALL_BOLD }}
                color={Color.PRIMARY_7}
                rightIcon="main-share"
                rightIconProps={{ color: Color.PRIMARY_7, size: 10 }}
              >
                {getString('learnMore')}
              </Text>
            </Layout.Horizontal>
            <img src={NetworkMap} alt="Network Map" className={css.image} />
            <List
              title={getString('discovery.whatIsNetworkMap')}
              content={getString('discovery.networkMapDescription')}
              margin={{ top: 'medium', bottom: 'xlarge' }}
            />
            <List
              title={getString('discovery.howToCreateNetworkMap')}
              content={getString('discovery.howToCreateNetworkMapDesc')}
              margin={{ top: 'medium', bottom: 'xlarge' }}
            />
            <List
              title={getString('discovery.whatIsServiceDiscovery')}
              content={getString('discovery.whatIsServiceDiscoveryDesc')}
              margin={{ top: 'medium' }}
            />
          </Layout.Vertical>
        </div>
      </Layout.Horizontal>
    </>
  )
}

export default CreateDAgent
