import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Company,
  Contract,
  CreateAssignmentInput,
  CreateContractInput,
  CreateGuardInput,
  EndAssignmentInput,
  Guard,
  GuardAssignment,
  UpdateCompanyInput,
  UpdateContractInput,
  UpdateGuardInput,
} from '@segapp/contracts';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  }),
  tagTypes: ['Company', 'Contracts', 'Guards', 'Assignments'],
  endpoints: (builder) => ({
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

    getContracts: builder.query<Contract[], void>({
      query: () => '/contracts',
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

    updateContract: builder.mutation<Contract, {
      id: string,
      body: UpdateContractInput;
    }>({
      query: ({ id, body }) => ({
        url: `/contracts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Contracts'],
    }),

    toggleContract: builder.mutation<Contract, string>({
      query: (id) => ({
        url: `/contracts/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Contracts'],
    }),

    //Guards
    getGuards: builder.query<Guard[], void>({
      query: () => '/guards',
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

    updateGuard: builder.mutation<Guard, {
      id: string;
      body: UpdateGuardInput;
    }>({
      query: ({ id, body }) => ({
        url: `/guards/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Guards'],
    }),

    toggleGuard: builder.mutation<Guard, string>({
      query: (id) => ({
        url: `/guards/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Guards']
    }),

    /** Assignments */
    getAssignments: builder.query<GuardAssignment[], void>({
      query: () => '/assignments',
      providesTags: ['Assignments']
    }),

    createAssignment: builder.mutation<GuardAssignment, CreateAssignmentInput>({
      query: (body) => ({
        url: '/assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Assignments']
    }),

    endAssignment: builder.mutation<GuardAssignment, {
      id: string,
      body?: EndAssignmentInput,
    }>({
      query: ({ id, body }) => ({
        url: `/assignments/${id}/end`,
        method: 'PATCH',
        body: body ?? {}
      }),
      invalidatesTags: ['Assignments'],
    }),
  }),
});

export const {
  useGetCurrentCompanyQuery,
  useUpdateCurrentCompanyMutation,

  useGetContractsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useToggleContractMutation,

  useGetGuardsQuery,
  useCreateGuardMutation,
  useUpdateGuardMutation,
  useToggleGuardMutation,

  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
  useEndAssignmentMutation,
} = api;
