/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { UseGetReturnData } from '@common/utils/testUtils'
import type { ResponseMapStringMapStringListString, ResponseNGTriggerResponse } from 'services/pipeline-ng'

export const GetGitTriggerEventDetailsResponse: UseGetReturnData<ResponseMapStringMapStringListString> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      Github: {
        IssueComment: ['Create', 'Edit', 'Delete'],
        PullRequest: ['Close', 'Edit', 'Open', 'Reopen', 'Label', 'Unlabel', 'Synchronize'],
        Push: []
      },
      Bitbucket: {
        PullRequest: ['Create', 'Update', 'Merge', 'Decline'],
        Push: []
      },
      Gitlab: {
        MergeRequest: ['Open', 'Close', 'Reopen', 'Merge', 'Update', 'Sync'],
        Push: []
      },
      AwsCodeCommit: {
        Push: []
      }
    },
    metaData: null as unknown as undefined,
    correlationId: '45939431-731c-4434-89b0-4414ac46d3f7'
  }
}

export const GetTriggerResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'All Values',
      identifier: 'All_Values',
      description: 'desc',
      type: 'Webhook',
      accountIdentifier: 'accountId',
      orgIdentifier: 'default',
      projectIdentifier: 'project1',
      targetIdentifier: 'noinputspipeline1',
      yaml: 'trigger:\n    name: All Values\n    identifier: All_Values\n    enabled: true\n    description: desc\n    tags:\n        tag1: value1\n    orgIdentifier: default\n    projectIdentifier: project1\n    pipelineIdentifier: noinputspipeline1\n    source:\n        type: Webhook\n        spec:\n            type: Github\n            spec:\n                type: IssueComment\n                spec:\n                    connectorRef: test\n                    autoAbortPreviousExecutions: true\n                    payloadConditions:\n                        - key: changedFiles\n                          operator: NotEquals\n                          value: x\n                        - key: sourceBranch\n                          operator: Equals\n                          value: sourceBranch\n                        - key: targetBranch\n                          operator: In\n                          value: val1, val2\n                        - key: <+trigger.payload.path>\n                          operator: StartsWith\n                          value: "1"\n                    headerConditions:\n                        - key: <+trigger.header["key-name"]>\n                          operator: EndsWith\n                          value: release\n                    jexlCondition: jexlCondition\n                    repoName: reponame\n                    actions:\n                        - Create\n                        - Edit\n                        - Delete\n    inputYaml: ""\n',
      enabled: true
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetCustomWebhookTriggerResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'custom-webhook',
      identifier: 'customwebhook',
      description: '',
      type: 'Webhook',
      accountIdentifier: 'cdGvQ7f_Quqe9JaDIoHbEw',
      orgIdentifier: 'default',
      projectIdentifier: 'mtran',
      targetIdentifier: 'pipelinenoruntimeinputs',
      yaml: 'trigger:\n  name: custom-webhook\n  identifier: customwebhook\n  enabled: true\n  description: ""\n  tags: {}\n  orgIdentifier: default\n  projectIdentifier: mtran\n  pipelineIdentifier: pipelinenoruntimeinputs\n  source:\n    type: Webhook\n    spec:\n      type: Custom\n      spec:\n        payloadConditions:\n          - key: attr\n            operator: NotEquals\n            value: val1\n        headerConditions:\n          - key: attr\n            operator: NotEquals\n            value: var1\n        jexlCondition: "true"\n  inputYaml: |\n    pipeline: {}\n',
      enabled: true,
      errorResponse: false
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetParseableManifestTriggerResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'test-helm-chart',
      identifier: 'newManifest',
      type: 'Manifest',
      accountIdentifier: 'px7xd_BFRCi-pfWPYXVjvw',
      orgIdentifier: 'harness',
      projectIdentifier: 'mtran',
      targetIdentifier: 'testmanifest',
      yaml: 'trigger:\n    name: test-helm-chart\n    identifier: newManifest\n    enabled: false\n    tags: {}\n    orgIdentifier: harness\n    projectIdentifier: mtran\n    pipelineIdentifier: testmanifest\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stage\n            manifestRef: s3manifestid\n            type: HelmChart\n            spec:\n                store:\n                    type: S3\n                    spec:\n                        connectorRef: account.sdhgjhgdj\n                        bucketName: aa\n                        folderPath: chartPathasdfasdfasdfasdfasdfadsf\n                        region: us-gov-west-1\n                chartName: asd\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: testmanifest\n            stages:\n                - stage:\n                      identifier: stage\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: s3manifestid\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: account.sdhgjhgdj\n                                                            bucketName: aa\n                                                            folderPath: chartPathasdfasdfasdfasdfasdfadsf\n                                                            region: us-gov-west-1\n                                                    chartName: asd\n                                                    chartVersion: <+trigger.manifest.version>\n                                                    helmVersion: V2\n                                                    skipResourceVersioning: false\n                                          - manifest:\n                                                identifier: gcrManifestId\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: Gcs\n                                                        spec:\n                                                            connectorRef: ""\n                                          - manifest:\n                                                identifier: httpManifestIdentifierasdfasdfasdf\n                                                type: HelmChart\n                                                spec:\n                                                    chartVersion: ""\n                                                    skipResourceVersioning: false\n                                                    commandFlags:\n                                                        - commandType: Fetch\n                                                          flag: ""\n                                          - manifest:\n                                                identifier: gcrIdentifier\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: Gcs\n                                                        spec:\n                                                            connectorRef: ""\n                                                    chartVersion: ""\n                              serviceRef: ""\n                          infrastructure:\n                              environmentRef: ""\n                              infrastructureDefinition:\n                                  type: KubernetesDirect\n                                  spec:\n                                      connectorRef: ""\n                                      namespace: ""\n                                      releaseName: ""\n                              infrastructureKey: ""\n                - stage:\n                      identifier: stage2\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      artifacts:\n                                          primary:\n                                              type: DockerRegistry\n                                              spec:\n                                                  tag: ""\n                                      manifests:\n                                          - manifest:\n                                                identifier: manifestId\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            bucketName: ""\n                                                            folderPath: ""\n                              serviceRef: ""\n                          infrastructure:\n                              environmentRef: ""\n                - stage:\n                      identifier: manifeststage\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: manifest\n                                                type: K8sManifest\n                                                spec:\n                                                    store:\n                                                        type: Github\n                                                        spec:\n                                                            branch: ""\n                              serviceRef: ""\n                          infrastructure:\n                              environmentRef: ""\n',
      enabled: false
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetParseableArtifactTriggerResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      enabled: false,
      identifier: 'GCRPrimaryprimarytrigger',
      name: 'GCRPrimary-primary-trigger',
      orgIdentifier: 'default',
      projectIdentifier: 'test',
      targetIdentifier: 'TestPipelineABC',
      type: 'Artifact',
      yaml: 'trigger:\n    name: GCRPrimary-primary-trigger\n    identifier: GCRPrimaryprimarytrigger\n    enabled: true\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: test\n    pipelineIdentifier: TestPipelineABC\n    source:\n        type: Artifact\n        spec:\n            stageIdentifier: stagea\n            type: Gcr\n            spec:\n                connectorRef: testgcp1a\n                imagePath: sdfds\n                registryHostname: ""\n                tag: <+trigger.artifact.build>\n                eventConditions:\n                    - key: build\n                      operator: Equals\n                      value: sdfdsf\n            artifactRef: primary\n    inputYaml: |\n        pipeline:\n            identifier: TestPipelineABC\n            stages:\n                - stage:\n                      identifier: stagea\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: sdfds\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            bucketName: ""\n                                                            folderPath: ""\n                                                    chartName: ""\n                                          - manifest:\n                                                identifier: testhelmmanifest\n                                                type: HelmChart\n                                                spec:\n                                                    chartName: ""\n                                                    chartVersion: ""\n                                          - manifest:\n                                                identifier: werewr\n                                                type: HelmChart\n                                                spec:\n                                                    chartVersion: ""\n                                      artifacts:\n                                          sidecars:\n                                              - sidecar:\n                                                    identifier: testsideid\n                                                    type: Gcr\n                                                    spec:\n                                                        connectorRef: ""\n                                                        imagePath: ""\n                                                        registryHostname: ""\n                                                        tag: ""\n                                              - sidecar:\n                                                    identifier: artifactgcrida\n                                                    type: Gcr\n                                                    spec:\n                                                        imagePath: ""\n                                                        registryHostname: ""\n                                                        tag: ""\n                                              - sidecar:\n                                                    identifier: sdfsdf\n                                                    type: DockerRegistry\n                                                    spec:\n                                                        tag: ""\n                                          primary:\n                                              type: Gcr\n                                              spec:\n                                                  connectorRef: testgcp1a\n                                                  imagePath: sdfds\n                                                  registryHostname: ""\n                                                  tag: sdfdafd\n            properties:\n                ci:\n                    codebase:\n                        build:\n                            type: branch\n                            spec:\n                                branch: <+trigger.branch>\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

// has null artifact identifier
export const GetParseableParallelStageArtifactTriggerResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      enabled: false,
      identifier: 'parallelArtifactTrigger',
      name: 'parallelArtifactTrigger',
      orgIdentifier: 'default',
      projectIdentifier: 'test',
      targetIdentifier: 'artifactpipeline1',
      type: 'Artifact',
      yaml: 'trigger:\n    name: parallelArtifactTrigger\n    identifier: parallelArtifactTrigger\n    enabled: true\n    tags: {}\n    source:\n        type: Artifact\n        spec:\n            stageIdentifier: stage1\n            type: DockerRegistry\n            spec:\n                imagePath: imagePath\n                tag: <+trigger.artifact.build>\n                eventConditions: []\n            artifactRef: primary\n    inputYaml: |\n        pipeline:\n            identifier: artifactpipeline1\n            stages:\n                - parallel:\n                      - stage:\n                            identifier: stage1\n                            type: Deployment\n                            spec:\n                                serviceConfig:\n                                    serviceDefinition:\n                                        type: Kubernetes\n                                        spec:\n                                            artifacts:\n                                                primary:\n                                                    type: DockerRegistry\n                                                    spec:\n                                                        imagePath: imagePath\n                                                        tag: <+trigger.artifact.build>\n                      - stage:\n                            identifier: stage2\n                            type: Deployment\n                            spec:\n                                serviceConfig:\n                                    serviceDefinition:\n                                        type: Kubernetes\n                                        spec:\n                                            artifacts:\n                                                primary:\n                                                    identifier:\n                                                    type: DockerRegistry\n                                                    spec:\n                                                        tag: latest\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const clearedArtifactIdentifierResponse =
  'trigger:\n  name: parallelArtifactTrigger\n  identifier: parallelArtifactTrigger\n  enabled: false\n  tags: {}\n  source:\n    type: Artifact\n    spec:\n      stageIdentifier: stage1\n      type: DockerRegistry\n      spec:\n        imagePath: imagePath\n        tag: <+trigger.artifact.build>\n        eventConditions: []\n      artifactRef: primary\n  inputYaml: |\n    pipeline:\n      identifier: artifactpipeline1\n      stages:\n        - parallel:\n            - stage:\n                identifier: stage1\n                type: Deployment\n                spec:\n                  serviceConfig:\n                    serviceDefinition:\n                      type: Kubernetes\n                      spec:\n                        artifacts:\n                          primary:\n                            type: DockerRegistry\n                            spec:\n                              imagePath: imagePath\n                              tag: <+trigger.artifact.build>\n            - stage:\n                identifier: stage2\n                type: Deployment\n                spec:\n                  serviceConfig:\n                    serviceDefinition:\n                      type: Kubernetes\n                      spec:\n                        artifacts:\n                          primary:\n                            type: DockerRegistry\n                            spec:\n                              tag: latest\n'

export const GetTriggerWithEventConditionsResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'test-helm-chart',
      identifier: 'newManifest',
      type: 'Manifest',
      accountIdentifier: 'px7xd_BFRCi-pfWPYXVjvw',
      orgIdentifier: 'harness',
      projectIdentifier: 'mtran',
      targetIdentifier: 'testmanifest',
      yaml: 'trigger:\n    name: trigger-two-2a\n    identifier: triggertwo2a\n    enabled: true\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: test\n    pipelineIdentifier: Testpipeline3\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stageb\n            manifestRef: sdfds\n            type: HelmChart\n            spec:\n                store:\n                    type: S3\n                    spec:\n                        connectorRef: testecr2\n                        bucketName: ""\n                        folderPath: sdfdsfd\n                        region: us-west-2\n                chartName: sdfdsfd\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions:\n                    - key: version\n                      operator: NotEquals\n                      value: "121"\n    inputYaml: |\n        pipeline:\n            identifier: Testpipeline3\n            stages:\n                - stage:\n                      identifier: stagea\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: sdfds\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: ""\n                                                            bucketName: ""\n                                                            region: ""\n                                                    chartVersion: ""\n                                          - manifest:\n                                                identifier: sfdsqeqemanifestid\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: ""\n                                                            bucketName: ""\n                                                            folderPath: ""\n                                                            region: ""\n                                                    chartName: ""\n                                                    chartVersion: ""\n                - stage:\n                      identifier: stageb\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: sdfds\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: testecr2\n                                                            bucketName: ""\n                                                            folderPath: sdfdsfd\n                                                            region: us-west-2\n                                                    chartName: sdfdsfd\n                                                    chartVersion: <+trigger.manifest.version>\n                                                    helmVersion: V2\n                                                    skipResourceVersioning: false\n',
      enabled: false
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetManifestTriggerResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'triggertest2',
      identifier: 'triggertest2',
      description: 'desc',
      type: 'Manifest',
      accountIdentifier: 'accountId',
      orgIdentifier: 'default',
      projectIdentifier: 'project1',
      targetIdentifier: 'TestPipelineABC',

      yaml: 'trigger:\n    name: sdfsdfdsfdfd\n    identifier: sdfsdfdsfdfd\n    enabled: true\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: test\n    pipelineIdentifier: TestPipelineABC\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stagea\n            manifestRef: testhelmmanifest\n            type: HelmChart\n            spec:\n                store:\n                    type: S3\n                    spec:\n                        connectorRef: testecr2\n                        bucketName: ""\n                        folderPath: sdfds\n                        region: ""\n                chartName: sdfds\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: TestPipelineABC\n            stages:\n                - stage:\n                      identifier: stagea\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: sdfds\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            bucketName: ""\n                                                            folderPath: ""\n                                                    chartName: ""\n                                                    chartVersion: ""\n                                          - manifest:\n                                                identifier: testhelmmanifest\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: testecr2\n                                                            bucketName: ""\n                                                            folderPath: sdfds\n                                                            region: ""\n                                                    chartName: sdfds\n                                                    chartVersion: <+trigger.manifest.version>\n                                                    helmVersion: V2\n                                                    skipResourceVersioning: false\n',
      enabled: true
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetTriggerRepoOrgConnectorResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'test-github-repo',
      identifier: 'testgithub',
      description: '',
      type: 'Webhook',
      accountIdentifier: 'accountId',
      orgIdentifier: 'default',
      projectIdentifier: 'project1',
      targetIdentifier: 'pipeline1',
      yaml: 'trigger:\n    name: test-github-repo\n    identifier: testgithub\n    enabled: true\n    description: ""\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: project1\n    pipelineIdentifier: pipeline1\n    source:\n        type: Webhook\n        spec:\n            type: Github\n            spec:\n                type: PullRequest\n                spec:\n                    connectorRef: repoconnector\n                    autoAbortPreviousExecutions: true\n                    payloadConditions:\n                        - key: sourceBranch\n                          operator: Equals\n                          value: sourceBranchValue\n                        - key: targetBranch\n                          operator: Equals\n                          value: targetBranchValue\n                    headerConditions:\n                        - key: <+trigger.header["key-name"]>\n                          operator: Equals\n                          value: "123"\n                    jexlCondition: jexlCondition\n                    actions:\n                        - Close\n                        - Edit\n                        - Reopen\n    inputYaml: |\n        pipeline:\n            identifier: pipeline1\n            stages:\n                - stage:\n                      identifier: stage1\n                      type: Deployment\n                      spec:\n                          infrastructure:\n                              environmentRef: ""\n                              infrastructureDefinition:\n                                  type: KubernetesDirect\n                                  spec:\n                                      namespace: ""\n',
      enabled: true
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetCustomTriggerWithVariablesResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'customtrigger',
      identifier: 'customtrigger',
      description: '',
      type: 'Webhook',
      accountIdentifier: 'sjmVqavzTuS1segZNyZqbA',
      orgIdentifier: 'default',
      projectIdentifier: 'SanityTest_Triggger',
      targetIdentifier: 'mt',
      yaml: 'trigger:\n    name: customtrigger\n    identifier: customtrigger\n    enabled: true\n    description: ""\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: SanityTest_Triggger\n    pipelineIdentifier: mt\n    source:\n        type: Webhook\n        spec:\n            type: Custom\n            spec:\n                payloadConditions: []\n                headerConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: mt\n            properties:\n                ci:\n                    codebase:\n                        build:\n                            type: branch\n                            spec:\n                                branch: test\n            stages:\n                - stage:\n                      identifier: Coverage_Report\n                      type: CI\n                      spec:\n                          execution:\n                              steps:\n                                  - step:\n                                        identifier: Jest\n                                        type: Run\n                                        spec:\n                                            command: echo \'from trigger\'\n                          infrastructure:\n                              type: KubernetesDirect\n                              spec:\n                                  namespace: default\n            variables:\n                - name: var1\n                  type: String\n                  value: "123"\n',
      enabled: true
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const PostCreateVariables = {
  status: 'SUCCESS',
  data: {
    yaml: '---\npipeline:\n  name: "MT4L7YXSQmi_27yLRaP1Zg"\n  identifier: "mt"\n  projectIdentifier: "T7tV_aRXQ8G7lcmg4ynwZg"\n  orgIdentifier: "zAJvJXomQ7abyrOBSX7_JA"\n  tags:\n    __uuid: "RDTCeSkBRFS70pfls1Gj_A"\n  properties:\n    ci:\n      codebase:\n        connectorRef: "n0fTxVj7T9m9FQ7ZSEa2Tw"\n        build: "RRfGYgfiRZWdrRXvEg7a_A"\n        __uuid: "LE0Dx8gNS3maiJCMwg_P8Q"\n      __uuid: "mUQ83nCeTOSt5EM1etKqCw"\n    __uuid: "-vcp3lcTTsuzsPKCXVH3Mw"\n  stages:\n  - stage:\n      name: "Glf_lyHLRn6aDslQB2WsrA"\n      identifier: "Coverage_Report"\n      type: "CI"\n      spec:\n        cloneCodebase: "mq06vZp_SCSMGbbfcBAD6A"\n        execution:\n          steps:\n          - step:\n              type: "Run"\n              name: "-KVpswWuRe2PMpQnwGyung"\n              identifier: "Jest"\n              spec:\n                connectorRef: "QZAoLGy_TOOh7UJOFhE-4g"\n                image: "qoZzgFOXTbuwUZFbcm0pkA"\n                command: "Zof5JF9vS9-N0CFrmGkpzg"\n                envVariables:\n                  GIT_BOT_TOKEN: "U3Si4-_QSrWeB-Fa3afCPg"\n                  GIT_EMAIL: "X_WycWqfQTqBSd40EQaECw"\n                  GIT_USER: "9VCyQxg9SZmYL7W4_4JuXQ"\n                  __uuid: "gVu5R7uAT3iDcsHspc5F0w"\n                resources:\n                  limits:\n                    memory: "d9EQ5v8ETX-6u1TWxBu-pg"\n                    cpu: "c-SlorclR8G0_-1y7S8GtQ"\n                    __uuid: "KhKQ4J5kTZmLPYaefaM0FQ"\n                  __uuid: "r9DI9reARKq2BLzS1ayHrA"\n                privileged: "sDfYi0aARhusAeLTLPN4Pw"\n                __uuid: "hosJltu8QRKK9TaE7s5CTg"\n              description: "pNVt7Hy9QXqTpBNAqL6PKA"\n              __uuid: "3phJ5LzuTJa8NmdMlQy2jw"\n            __uuid: "t1qHDMDTQ9KuxVmg-QG-6Q"\n          __uuid: "B2K-1w3nQEKk1qyMfXPFAQ"\n        serviceDependencies: []\n        infrastructure:\n          type: "KubernetesDirect"\n          spec:\n            connectorRef: "2Cushoe8RxmA5CumLBGacg"\n            namespace: "nvdapXFGTo2NkkSX2VchfQ"\n            __uuid: "DDL8c2uxTN-ONW3bTKKcgQ"\n          __uuid: "59bfR6oWRzWrPT5fO6CgqA"\n        __uuid: "EI4QTXvqSheZmc73-zJYPg"\n      when:\n        pipelineStatus: "hZfX2HHSQIOtdMoHjvPOHg"\n        __uuid: "sgTwcwu9Tou22Fu90S4_SA"\n      __uuid: "6ELzeEQfRS2k711rMWalMg"\n    __uuid: "9VR-VkoMTjamsvZhqLt6KQ"\n  variables:\n  - name: "var1"\n    type: "String"\n    value: "U19nOF-TRVqe67HQPxc9WA"\n    __uuid: "Kje5g4QYRIqypH2dnMccNQ"\n  - name: "var2"\n    type: "String"\n    default: "iUITesnwSUWq7eLuU9fsOw"\n    value: "qnk94b-MQoy15lycY3PbJQ"\n    __uuid: "h7qYvGBXTVmHLRhwktR-6Q"\n  - name: "var3withDefault"\n    type: "String"\n    default: "PvLUfdpBQsWNoc3Piam3cQ"\n    value: "-fPxi3wTTrCL-lx1qQ6FNw"\n    __uuid: "UZERAVq8T56f44SZ-eHDug"\n  __uuid: "j0jogMcYSve5XFqwG_BZrA"\n__uuid: "DBcLLYeNSrmwc3j1sM5kDg"\n' as unknown as any,
    metadataMap: {
      j0jogMcYSve5XFqwG_BZrA: {
        yamlProperties: {
          fqn: 'pipeline',
          localName: 'pipeline'
        },
        yamlOutputProperties: null
      },
      MT4L7YXSQmi_27yLRaP1Zg: {
        yamlProperties: {
          fqn: 'pipeline.name',
          localName: 'pipeline.name'
        },
        yamlOutputProperties: null
      },
      '-fPxi3wTTrCL-lx1qQ6FNw': {
        yamlProperties: {
          fqn: 'pipeline.variables.var3withDefault',
          localName: 'pipeline.variables.var3withDefault'
        },
        yamlOutputProperties: null
      },
      'qnk94b-MQoy15lycY3PbJQ': {
        yamlProperties: {
          fqn: 'pipeline.variables.var2',
          localName: 'pipeline.variables.var2'
        },
        yamlOutputProperties: null
      },
      'U19nOF-TRVqe67HQPxc9WA': {
        yamlProperties: {
          fqn: 'pipeline.variables.var1',
          localName: 'pipeline.variables.var1'
        },
        yamlOutputProperties: null
      },
      'U3Si4-_QSrWeB-Fa3afCPg': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.envVariables.GIT_BOT_TOKEN',
          localName: 'execution.steps.Jest.spec.envVariables.GIT_BOT_TOKEN'
        },
        yamlOutputProperties: null
      },
      X_WycWqfQTqBSd40EQaECw: {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.envVariables.GIT_EMAIL',
          localName: 'execution.steps.Jest.spec.envVariables.GIT_EMAIL'
        },
        yamlOutputProperties: null
      },
      'd9EQ5v8ETX-6u1TWxBu-pg': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.resources.limits.memory',
          localName: 'execution.steps.Jest.spec.resources.limits.memory'
        },
        yamlOutputProperties: null
      },
      '9VCyQxg9SZmYL7W4_4JuXQ': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.envVariables.GIT_USER',
          localName: 'execution.steps.Jest.spec.envVariables.GIT_USER'
        },
        yamlOutputProperties: null
      },
      Glf_lyHLRn6aDslQB2WsrA: {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.name',
          localName: 'stage.stages.Coverage_Report.name'
        },
        yamlOutputProperties: null
      },
      '-KVpswWuRe2PMpQnwGyung': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.name',
          localName: 'execution.steps.Jest.name'
        },
        yamlOutputProperties: null
      },
      '6ELzeEQfRS2k711rMWalMg': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report',
          localName: 'stage'
        },
        yamlOutputProperties: null
      },
      sDfYi0aARhusAeLTLPN4Pw: {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.privileged',
          localName: 'execution.steps.Jest.spec.privileged'
        },
        yamlOutputProperties: null
      },
      'QZAoLGy_TOOh7UJOFhE-4g': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.connectorRef',
          localName: 'execution.steps.Jest.spec.connectorRef'
        },
        yamlOutputProperties: null
      },
      'c-SlorclR8G0_-1y7S8GtQ': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.resources.limits.cpu',
          localName: 'execution.steps.Jest.spec.resources.limits.cpu'
        },
        yamlOutputProperties: null
      },
      qoZzgFOXTbuwUZFbcm0pkA: {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.image',
          localName: 'execution.steps.Jest.spec.image'
        },
        yamlOutputProperties: null
      },
      '3phJ5LzuTJa8NmdMlQy2jw': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest',
          localName: 'step'
        },
        yamlOutputProperties: null
      },
      'Zof5JF9vS9-N0CFrmGkpzg': {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.spec.command',
          localName: 'execution.steps.Jest.spec.command'
        },
        yamlOutputProperties: null
      },
      pNVt7Hy9QXqTpBNAqL6PKA: {
        yamlProperties: {
          fqn: 'pipeline.stages.Coverage_Report.spec.execution.steps.Jest.description',
          localName: 'execution.steps.Jest.description'
        },
        yamlOutputProperties: null
      }
    },
    errorResponses: null
  },
  metaData: null,
  correlationId: '744009cf-bf3a-4db4-b2f4-aae207739d76'
}

// missing sourceRepo
export const GetTriggerInvalidYamlResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'AllValues123',
      identifier: 'AllValues',
      description: 'desc',
      type: 'Webhook',
      accountIdentifier: 'accountIdentifier',
      orgIdentifier: 'default',
      projectIdentifier: 'project1',
      targetIdentifier: 'p1',
      enabled: false,
      yaml: 'trigger:\n  name: AllValues123\n  identifier: AllValues\n  enabled: false\n  description: desc\n  target:\n    targetIdentifier: p1\n    type: Pipeline\n    spec:\n      runtimeInputYaml: |\n        pipeline:\n          identifier: p1\n          stages:\n            - stage:\n                identifier: stage1\n                type: Deployment\n                spec:\n                  infrastructure:\n                    infrastructureDefinition:\n                      type: KubernetesDirect\n                      spec:\n                        namespace: newNameSpaces\n                        releaseName: "22"\n  source:\n    type: Webhook\n    spec:\n      spec:\n        gitRepoSpec:\n          identifier: tesa1\n          repoName: triggerNgDemo\n        event: PullRequest\n        actions:\n          - closed\n          - edited\n          - opened\n        payloadConditions:\n          - key: sourceBranch\n            operator: Equals\n            value: "123"\n          - key: targetBranch\n            operator: Regex\n            value: Regex\n          - key: abcd\n            operator: In\n            value: abc\n          - key: defg\n            operator: NotIn\n            value: def\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetTriggerEmptyActionsResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'All Values',
      identifier: 'All_Values',
      description: 'desc',
      type: 'Webhook',
      accountIdentifier: 'accountId',
      orgIdentifier: 'default',
      projectIdentifier: 'project1',
      targetIdentifier: 'noinputspipeline1',
      yaml: 'trigger:\n    name: All Values\n    identifier: All_Values\n    enabled: false\n    description: desc\n    tags:\n        tag1: value1\n    orgIdentifier: default\n    projectIdentifier: project1\n    pipelineIdentifier: noinputspipeline1\n    source:\n        type: Webhook\n        spec:\n            type: Github\n            spec:\n                type: IssueComment\n                spec:\n                    connectorRef: test\n                    autoAbortPreviousExecutions: true\n                    payloadConditions:\n                        - key: changedFiles\n                          operator: NotEquals\n                          value: x\n                        - key: sourceBranch\n                          operator: Equals\n                          value: sourceBranch\n                        - key: targetBranch\n                          operator: In\n                          value: val1, val2\n                        - key: <+trigger.payload.path>\n                          operator: StartsWith\n                          value: "1"\n                    headerConditions:\n                        - key: <+trigger.header["key-name"]>\n                          operator: EndsWith\n                          value: release\n                    jexlCondition: jexlCondition\n                    repoName: reponame\n                    actions: []\n    inputYaml: |\n        pipeline: {}\n',

      enabled: false
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const GetTriggerWithPushEventResponse: UseGetReturnData<ResponseNGTriggerResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      name: 'github-connector',
      identifier: 'githubconnector',
      type: 'Webhook',
      accountIdentifier: 'accountId',
      orgIdentifier: 'default',
      projectIdentifier: 'mtproject',
      targetIdentifier: 'pipeline1',
      yaml: 'trigger:\n  name: github-connector\n  identifier: githubconnector\n  enabled: true\n  tags: {}\n  target:\n    targetIdentifier: pipeline1\n    type: Pipeline\n    spec:\n      runtimeInputYaml: |\n        pipeline:\n          identifier: pipeline1\n          stages:\n            - stage:\n                identifier: stage1\n                spec:\n                  serviceConfig:\n                    serviceRef: ""\n                  infrastructure:\n                    environmentRef: ""\n  source:\n    type: Webhook\n    spec:\n      type: GITHUB\n      spec:\n        gitRepoSpec:\n          identifier: mtaccountgithubconnector\n          repoName: repoName\n        event: Push\n        actions: []\n',

      enabled: true
    },
    metaData: null as unknown as undefined,
    correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
  }
}

export const updateTriggerMockResponse = {
  status: 'SUCCESS',
  data: {
    name: 'AllValues123',
    identifier: 'AllValues',
    description: 'desc',
    type: 'Webhook',
    accountIdentifier: 'accountIdentifier',
    orgIdentifier: 'default',
    projectIdentifier: 'project1',
    targetIdentifier: 'p1',
    yaml: 'trigger:\n  name: AllValues123\n  identifier: AllValues\n  enabled: false\n  description: desc\n  target:\n    targetIdentifier: p1\n    type: Pipeline\n    spec:\n      runtimeInputYaml: |\n        pipeline:\n          identifier: p1\n          stages:\n            - stage:\n                identifier: stage1\n                type: Deployment\n                spec:\n                  infrastructure:\n                    infrastructureDefinition:\n                      type: KubernetesDirect\n                      spec:\n                        namespace: newNameSpaces\n                        releaseName: "22"\n  source:\n    type: Webhook\n    spec:\n      type: GITHUB\n      spec:\n        gitRepoSpec:\n          identifier: tesa1\n          repoName: triggerNgDemo\n        event: PullRequest\n        actions:\n          - closed\n          - edited\n          - opened\n        payloadConditions:\n          - key: sourceBranch\n            operator: Equals\n            value: "123"\n          - key: targetBranch\n            operator: Regex\n            value: Regex\n          - key: abcd\n            operator: In\n            value: abc\n          - key: defg\n            operator: NotIn\n            value: def\n',
    version: 13
  },
  metaData: null,
  correlationId: 'abd712b8-920a-43da-a382-228e93012e6e'
}

export const CreateTriggerResponse = {}

// double space instead of 4 and removed 3 org, project, pipeline identifiers
export const updateTriggerMockResponseYaml =
  'trigger:\n  name: All Values\n  identifier: All_Values\n  enabled: true\n  description: desc\n  tags:\n    tag1: value1\n  source:\n    type: Webhook\n    spec:\n      type: Github\n      spec:\n        type: IssueComment\n        spec:\n          connectorRef: test\n          autoAbortPreviousExecutions: true\n          payloadConditions:\n            - key: changedFiles\n              operator: NotEquals\n              value: x\n            - key: sourceBranch\n              operator: Equals\n              value: sourceBranch\n            - key: targetBranch\n              operator: In\n              value: val1, val2\n            - key: <+trigger.payload.path>\n              operator: StartsWith\n              value: "1"\n          headerConditions:\n            - key: <+trigger.header["key-name"]>\n              operator: EndsWith\n              value: release\n          jexlCondition: jexlCondition\n          repoName: reponame\n          actions:\n            - Create\n            - Edit\n            - Delete\n  inputYaml: |\n    pipeline:\n      properties:\n        ci:\n          codebase:\n            build:\n              type: branch\n              spec:\n                branch: <+trigger.branch>\n'
export const updateCustomTriggerMockResponseYaml =
  'trigger:\n  name: custom-webhook\n  identifier: customwebhook\n  enabled: true\n  description: ""\n  tags: {}\n  source:\n    type: Webhook\n    spec:\n      type: Custom\n      spec:\n        payloadConditions:\n          - key: attr\n            operator: NotEquals\n            value: val1\n        headerConditions:\n          - key: attr\n            operator: NotEquals\n            value: var1\n        jexlCondition: "true"\n  inputYaml: |\n    pipeline:\n      identifier: noinputspipeline1\n      variables:\n        - name: newVar\n          type: String\n          value: ""\n'
export const enabledFalseUpdateTriggerMockResponseYaml =
  'trigger:\n  name: All Values\n  identifier: All_Values\n  enabled: false\n  description: desc\n  tags:\n    tag1: value1\n  source:\n    type: Webhook\n    spec:\n      type: Github\n      spec:\n        type: IssueComment\n        spec:\n          connectorRef: test\n          autoAbortPreviousExecutions: true\n          payloadConditions:\n            - key: changedFiles\n              operator: NotEquals\n              value: x\n            - key: sourceBranch\n              operator: Equals\n              value: sourceBranch\n            - key: targetBranch\n              operator: In\n              value: val1, val2\n            - key: <+trigger.payload.path>\n              operator: StartsWith\n              value: "1"\n          headerConditions:\n            - key: <+trigger.header["key-name"]>\n              operator: EndsWith\n              value: release\n          jexlCondition: jexlCondition\n          repoName: reponame\n          actions:\n            - Create\n            - Edit\n            - Delete\n  inputYaml: |\n    pipeline:\n      identifier: noinputspipeline1\n      variables:\n        - name: newVar\n          type: String\n          value: ""\n'

export const updateManifestTriggerMockResponseYaml =
  'trigger:\n  name: sdfsdfdsfdfd\n  identifier: sdfsdfdsfdfd\n  enabled: true\n  tags: {}\n  source:\n    type: Manifest\n    spec:\n      stageIdentifier: stagea\n      manifestRef: testhelmmanifest\n      type: HelmChart\n      spec:\n        store:\n          type: S3\n          spec:\n            connectorRef: testecr2\n            bucketName: ""\n            folderPath: sdfds\n            region: ""\n        chartName: sdfds\n        chartVersion: <+trigger.manifest.version>\n        helmVersion: V2\n        skipResourceVersioning: false\n        eventConditions: []\n  inputYaml: |\n    pipeline:\n      identifier: TestPipelineABC\n      stages:\n        - stage:\n            identifier: stagea\n            type: Deployment\n            spec:\n              serviceConfig:\n                serviceDefinition:\n                  type: Kubernetes\n                  spec:\n                    manifests:\n                      - manifest:\n                          identifier: sdfds\n                          type: HelmChart\n                          spec:\n                            store:\n                              type: S3\n                              spec:\n                                bucketName: ""\n                                folderPath: ""\n                            chartName: ""\n                            chartVersion: ""\n                      - manifest:\n                          identifier: testhelmmanifest\n                          type: HelmChart\n                          spec:\n                            store:\n                              type: S3\n                              spec:\n                                connectorRef: testecr2\n                                bucketName: ""\n                                folderPath: sdfds\n                                region: ""\n                            chartName: sdfds\n                            chartVersion: <+trigger.manifest.version>\n                            helmVersion: V2\n                            skipResourceVersioning: false\n'
export const GetSchemaYaml = {
  status: 'SUCCESS',
  data: {
    type: 'object',
    properties: {
      trigger: {
        $ref: '#/definitions/NGTriggerConfigV2'
      }
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      AwsCodeCommitEventSpec: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      AwsCodeCommitPushSpec: {
        allOf: [
          {
            $ref: '#/definitions/AwsCodeCommitEventSpec'
          },
          {
            type: 'object',
            properties: {
              connectorRef: {
                type: 'string'
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      AwsCodeCommitSpec: {
        allOf: [
          {
            $ref: '#/definitions/WebhookTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['Push']
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Push'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/AwsCodeCommitPushSpec'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      BitbucketEventSpec: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      BitbucketPRSpec: {
        allOf: [
          {
            $ref: '#/definitions/BitbucketEventSpec'
          },
          {
            type: 'object',
            properties: {
              actions: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Create', 'Update', 'Merge', 'Decline']
                }
              },
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      BitbucketPushSpec: {
        allOf: [
          {
            $ref: '#/definitions/BitbucketEventSpec'
          },
          {
            type: 'object',
            properties: {
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      BitbucketSpec: {
        allOf: [
          {
            $ref: '#/definitions/WebhookTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['PullRequest', 'Push']
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'PullRequest'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/BitbucketPRSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Push'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/BitbucketPushSpec'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      CronTriggerSpec: {
        allOf: [
          {
            $ref: '#/definitions/ScheduledTriggerSpec'
          },
          {
            type: 'object',
            properties: {
              expression: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      CustomTriggerSpec: {
        allOf: [
          {
            $ref: '#/definitions/WebhookTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GithubEventSpec: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GithubIssueCommentSpec: {
        allOf: [
          {
            $ref: '#/definitions/GithubEventSpec'
          },
          {
            type: 'object',
            properties: {
              actions: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Create', 'Edit', 'Delete']
                }
              },
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GithubPRSpec: {
        allOf: [
          {
            $ref: '#/definitions/GithubEventSpec'
          },
          {
            type: 'object',
            properties: {
              actions: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Close', 'Edit', 'Open', 'Reopen', 'Label', 'Unlabel', 'Synchronize']
                }
              },
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GithubPushSpec: {
        allOf: [
          {
            $ref: '#/definitions/GithubEventSpec'
          },
          {
            type: 'object',
            properties: {
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GithubSpec: {
        allOf: [
          {
            $ref: '#/definitions/WebhookTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['PullRequest', 'Push', 'IssueComment']
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'IssueComment'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GithubIssueCommentSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'PullRequest'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GithubPRSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Push'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GithubPushSpec'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GitlabEventSpec: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GitlabPRSpec: {
        allOf: [
          {
            $ref: '#/definitions/GitlabEventSpec'
          },
          {
            type: 'object',
            properties: {
              actions: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Open', 'Close', 'Reopen', 'Merge', 'Update', 'Sync']
                }
              },
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GitlabPushSpec: {
        allOf: [
          {
            $ref: '#/definitions/GitlabEventSpec'
          },
          {
            type: 'object',
            properties: {
              autoAbortPreviousExecutions: {
                type: 'boolean'
              },
              connectorRef: {
                type: 'string'
              },
              headerConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              jexlCondition: {
                type: 'string'
              },
              payloadConditions: {
                type: 'array',
                items: {
                  $ref: '#/definitions/TriggerEventDataCondition'
                }
              },
              repoName: {
                type: 'string'
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      GitlabSpec: {
        allOf: [
          {
            $ref: '#/definitions/WebhookTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['MergeRequest', 'Push']
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'MergeRequest'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GitlabPRSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Push'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GitlabPushSpec'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      NGTriggerConfigV2: {
        type: 'object',
        required: ['identifier', 'orgIdentifier', 'projectIdentifier'],
        properties: {
          description: {
            type: 'string'
          },
          enabled: {
            type: 'boolean'
          },
          identifier: {
            type: 'string'
          },
          inputYaml: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          orgIdentifier: {
            type: 'string',
            const: 'default'
          },
          pipelineIdentifier: {
            type: 'string'
          },
          projectIdentifier: {
            type: 'string',
            const: 'project1'
          },
          source: {
            $ref: '#/definitions/NGTriggerSourceV2'
          },
          tags: {
            type: 'object',
            additionalProperties: {
              type: 'string'
            }
          }
        },
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      NGTriggerSourceV2: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['Webhook', 'Scheduled']
          }
        },
        $schema: 'http://json-schema.org/draft-07/schema#',
        allOf: [
          {
            if: {
              properties: {
                type: {
                  const: 'Scheduled'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/ScheduledTriggerConfig'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Webhook'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/WebhookTriggerConfigV2'
                }
              }
            }
          }
        ]
      },
      NGTriggerSpecV2: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      NgTriggerConfigSchemaWrapper: {
        type: 'object',
        properties: {
          trigger: {
            $ref: '#/definitions/NGTriggerConfigV2'
          }
        },
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      ScheduledTriggerConfig: {
        allOf: [
          {
            $ref: '#/definitions/NGTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string'
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Cron'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/CronTriggerSpec'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      ScheduledTriggerSpec: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      TriggerEventDataCondition: {
        type: 'object',
        properties: {
          key: {
            type: 'string'
          },
          operator: {
            type: 'string',
            enum: ['In', 'Equals', 'NotEquals', 'NotIn', 'Regex', 'EndsWith', 'StartsWith', 'Contains']
          },
          value: {
            type: 'string'
          }
        },
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      WebhookTriggerConfigV2: {
        allOf: [
          {
            $ref: '#/definitions/NGTriggerSpecV2'
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['Github', 'Gitlab', 'Bitbucket', 'Custom', 'AwsCodeCommit']
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'AwsCodeCommit'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/AwsCodeCommitSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Bitbucket'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/BitbucketSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Custom'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/CustomTriggerSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Github'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GithubSpec'
                }
              }
            }
          },
          {
            if: {
              properties: {
                type: {
                  const: 'Gitlab'
                }
              }
            },
            then: {
              properties: {
                spec: {
                  $ref: '#/definitions/GitlabSpec'
                }
              }
            }
          }
        ],
        $schema: 'http://json-schema.org/draft-07/schema#'
      },
      WebhookTriggerSpecV2: {
        type: 'object',
        discriminator: 'type',
        $schema: 'http://json-schema.org/draft-07/schema#'
      }
    }
  },
  metaData: null,
  correlationId: 'd317ef50-dda6-408b-94dc-c66da72e9bcf'
}

export const GetSettingValueResponse = {
  status: 'SUCCESS',
  data: {
    valueType: 'Boolean',
    value: 'false'
  },
  metaData: null,
  correlationId: '21667c6f-4afe-4d4d-9228-ab5d18121ae4'
}

export const GetSecretV2PromiseResponse = {
  status: 'SUCCESS',
  data: {
    secret: {
      type: 'SecretText',
      name: 'testAudit',
      identifier: 'testAudit',
      orgIdentifier: 'default',
      projectIdentifier: 'Kapil',
      tags: {},
      description: '',
      spec: {
        secretManagerIdentifier: 'harnessSecretManager',
        valueType: 'Inline',
        value: null
      }
    },
    createdAt: 1665490710042,
    updatedAt: 1665490710042,
    draft: false,
    governanceMetadata: null
  },
  metaData: null,
  correlationId: 'bdc0b57d-8c6a-46bc-b09c-3030342c7f18'
}
