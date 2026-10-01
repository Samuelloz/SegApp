import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
  AcceptInvitationInput,
  AcceptInvitationResponse,
  AssignmentListItem,
  Company,
  CompanyUserResponse,
  Contract,
  ContractAssignmentOption,
  ContractListItem,
  CreateAssignmentInput,
  CreateContractInput,
  CreateGuardInput,
  CreateInvitationInput,
  CreateInvitationResponse,
  CurrentSessionResponse,
  EndAssignmentInput,
  Guard,
  GuardAssignment,
  GuardAssignmentOption,
  GuardListItem,
  InvitationPreview,
  LoginInput,
  UpdateActiveStatusInput,
  UpdateCompanyInput,
  UpdateContractInput,
  UpdateGuardInput,
  VerifyContactInput,
  VerifyContactResponse,
} from '@segapp/contracts';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: [
    'Session',
    'Company',
    'CompanyUsers',
    'Contracts',
    'Guards',
    'Assignments',
  ],
  endpoints: (builder) => ({
    getInvitationPreview: builder.query<InvitationPreview, string>({
      query: (token) => `/invitations/${encodeURIComponent(token)}`,
    }),

    acceptInvitation: builder.mutation<
      AcceptInvitationResponse,
      AcceptInvitationInput
    >({
      query: (body) => ({
        url: '/invitations/accept',
        method: 'POST',
        body,
      }),
    }),

    createInvitation: builder.mutation<
      CreateInvitationResponse,
      CreateInvitationInput
    >({
      query: (body) => ({
        url: '/invitations',
        method: 'POST',
        body,
      }),
    }),

    verifyContact: builder.mutation<VerifyContactResponse, VerifyContactInput>({
      query: (body) => ({
        url: '/contact-verifications/verify',
        method: 'POST',
        body,
      }),
    }),

    login: builder.mutation<CurrentSessionResponse, LoginInput>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),

    getCurrentSession: builder.query<CurrentSessionResponse, void>({
      query: () => '/auth/session',
      providesTags: ['Session'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),

    getCurrentCompany: builder.query<Company, void>({
      query: () => '/companies/current',
      providesTags: ['Company'],
    }),

    updateCurrentCompany: builder.mutation<Company, UpdateCompanyInput>({
      query: (body) => ({
        url: '/companies/current',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Company'],
    }),

    getCompanyUsers: builder.query<CompanyUserResponse[], void>({
      query: () => '/companies/current/users',
      providesTags: ['CompanyUsers'],
    }),

    getContracts: builder.query<Contract[], void>({
      query: () => '/contracts',
      providesTags: ['Contracts'],
    }),

    getContractList: builder.query<ContractListItem[], void>({
      query: () => '/contracts/list',
      providesTags: ['Contracts'],
    }),

    getContractAssignmentOptions: builder.query<
      ContractAssignmentOption[],
      void
    >({
      query: () => '/contracts/assignment-options',
      providesTags: ['Contracts'],
    }),

    createContract: builder.mutation<Contract, CreateContractInput>({
      query: (body) => ({
        url: '/contracts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Contracts'],
    }),

    updateContract: builder.mutation<
      Contract,
      {
        id: string;
        body: UpdateContractInput;
      }
    >({
      query: ({ id, body }) => ({
        url: `/contracts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Contracts'],
    }),

    updateContractStatus: builder.mutation<
      Contract,
      {
        id: string;
        body: UpdateActiveStatusInput;
      }
    >({
      query: ({ id, body }) => ({
        url: `/contracts/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Contracts'],
    }),

    //Guards
    getGuards: builder.query<Guard[], void>({
      query: () => '/guards',
      providesTags: ['Guards'],
    }),

    getGuardList: builder.query<GuardListItem[], void>({
      query: () => '/guards/list',
      providesTags: ['Guards'],
    }),

    getGuardAssignmentOptions: builder.query<GuardAssignmentOption[], void>({
      query: () => '/guards/assignment-options',
      providesTags: ['Guards'],
    }),

    createGuard: builder.mutation<Guard, CreateGuardInput>({
      query: (body) => ({
        url: '/guards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Guards'],
    }),

    updateGuard: builder.mutation<
      Guard,
      {
        id: string;
        body: UpdateGuardInput;
      }
    >({
      query: ({ id, body }) => ({
        url: `/guards/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Guards'],
    }),

    updateGuardStatus: builder.mutation<
      Guard,
      {
        id: string;
        body: UpdateActiveStatusInput;
      }
    >({
      query: ({ id, body }) => ({
        url: `/guards/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Guards'],
    }),

    /** Assignments */
    getAssignments: builder.query<GuardAssignment[], void>({
      query: () => '/assignments',
      providesTags: ['Assignments'],
    }),

    getAssignmentList: builder.query<AssignmentListItem[], void>({
      query: () => '/assignments/list',
      providesTags: ['Assignments'],
    }),

    createAssignment: builder.mutation<GuardAssignment, CreateAssignmentInput>({
      query: (body) => ({
        url: '/assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Assignments'],
    }),

    endAssignment: builder.mutation<
      GuardAssignment,
      {
        id: string;
        body?: EndAssignmentInput;
      }
    >({
      query: ({ id, body }) => ({
        url: `/assignments/${id}/end`,
        method: 'PATCH',
        body: body ?? {},
      }),
      invalidatesTags: ['Assignments'],
    }),
  }),
});

export const {
  useGetInvitationPreviewQuery,
  useAcceptInvitationMutation,
  useCreateInvitationMutation,
  useVerifyContactMutation,

  useLoginMutation,
  useGetCurrentSessionQuery,
  useLogoutMutation,

  useGetCurrentCompanyQuery,
  useUpdateCurrentCompanyMutation,

  useGetCompanyUsersQuery,

  useGetContractsQuery,
  useGetContractListQuery,
  useGetContractAssignmentOptionsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useUpdateContractStatusMutation,

  useGetGuardsQuery,
  useGetGuardListQuery,
  useGetGuardAssignmentOptionsQuery,
  useCreateGuardMutation,
  useUpdateGuardMutation,
  useUpdateGuardStatusMutation,

  useGetAssignmentsQuery,
  useGetAssignmentListQuery,
  useCreateAssignmentMutation,
  useEndAssignmentMutation,
} = api;
