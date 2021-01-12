export enum StepType {
  HTTP = 'Http',
  SHELLSCRIPT = 'ShellScript',
  APPROVAL = 'Approval',
  Barrier = 'Barrier',
  K8sRollingRollback = 'K8sRollingRollback',
  K8sBlueGreenDeploy = 'K8sBlueGreenDeploy',
  K8sCanaryDeploy = 'K8sCanaryDeploy',
  K8sBGSwapServices = 'K8sBGSwapServices',
  K8sScale = 'K8sScale',
  K8sCanaryDelete = 'K8sCanaryDelete',
  StepGroup = 'StepGroup',
  DeployService = 'DeployService',
  DeployEnvironment = 'DeployEnvironment',
  KubernetesDirect = 'KubernetesDirect',
  K8sServiceSpec = 'K8sServiceSpec',
  K8sRollingDeploy = 'K8sRollingDeploy',
  CustomVariable = 'CustomVariable',
  Dependency = 'Service',
  Plugin = 'Plugin',
  Run = 'Run',
  GCR = 'BuildAndPushGCR',
  ECR = 'BuildAndPushECR',
  SaveCacheGCS = 'SaveCacheGCS',
  RestoreCacheGCS = 'RestoreCacheGCS',
  SaveCacheS3 = 'SaveCacheS3',
  RestoreCacheS3 = 'RestoreCacheS3',
  DockerHub = 'BuildAndPushDockerHub',
  GCS = 'GCSUpload',
  S3 = 'S3Upload',
  JFrogArtifactory = 'ArtifactoryUpload'
}
