import type {
  ResponseBoolean,
  ResponsePageApiKeyAggregateDTO,
  ResponsePageServiceAccountAggregateDTO
} from 'services/cd-ng'

export const serviceAccountsAggregate: ResponsePageServiceAccountAggregateDTO = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 50,
    content: [
      {
        serviceAccount: {
          identifier: 'Test_Service_Account',
          name: 'Test Service Account',
          email: 'test_service_account@service.harness.io',
          description: 'Test Service Account',
          tags: { 'test tag': '' },
          accountIdentifier: 'testAcc'
        },
        createdAt: 1625470034671,
        lastModifiedAt: 1625470034671,
        tokensCount: 0,
        roleAssignmentsMetadataDTO: [
          {
            identifier: 'role_assignment_txMLiECz1mKBwDGL2k8F',
            roleIdentifier: '_account_admin',
            roleName: 'Account Admin',
            resourceGroupIdentifier: '_all_resources',
            resourceGroupName: 'All Resources',
            managedRole: true,
            managedRoleAssignment: false
          }
        ]
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: {},
  correlationId: ''
}

export const apiKeyListAggregate: ResponsePageApiKeyAggregateDTO = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 2,
    pageItemCount: 2,
    pageSize: 50,
    content: [
      {
        apiKey: {
          identifier: 'valid',
          name: 'valid',
          description: '',
          tags: {},
          apiKeyType: 'SERVICE_ACCOUNT',
          parentIdentifier: 'bhuvan',
          defaultTimeToExpireToken: 2592000000,
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        },
        createdAt: 1625468152874,
        lastModifiedAt: 1625468152874,
        tokensCount: 1
      },
      {
        apiKey: {
          identifier: 'api_key',
          name: 'api key',
          description: '',
          tags: {},
          apiKeyType: 'SERVICE_ACCOUNT',
          parentIdentifier: 'bhuvan',
          defaultTimeToExpireToken: 2592000000,
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        },
        createdAt: 1625217747174,
        lastModifiedAt: 1625217747174,
        tokensCount: 2
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: {},
  correlationId: '97764fd3-e6e8-42de-b425-9652ecb52d74'
}

export const mockResponse: ResponseBoolean = {
  status: 'SUCCESS',
  data: true,
  metaData: {},
  correlationId: ''
}
