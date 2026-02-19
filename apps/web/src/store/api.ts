import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type Contract = {
    id: string;
    name: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type Guard = {
    id: string;
    fullname: string;
    employeeNumber: string;
    phone?: string | null;
    active?: boolean;
    createdAt: string;
    updatedAt: string;
}

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    }),
    tagTypes: ['Contracts', 'Guards'],
    endpoints: (builder) => ({
        getContracts: builder.query<Contract[], void>({
            query: () => '/contracts',
            providesTags: ['Contracts'],
        }),
        createContract: builder.mutation<Contract, { name: string }>({
            query: (body) => ({
                url: '/contracts',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Contracts'],
        }),
        toggleContract: builder.mutation<any, string>({
            query: (id) => ({
                url: `/contracts/${id}/toggle`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Contracts'],
        }),

        //Guards
        getGuards: builder.query<Guard[], void> ({
            query: () => '/guards',
            providesTags: ['Guards'],
        }),
        createGuard: builder.mutation<Guard, { fullname: string, employeeNumber: string, phone?: string }>({
            query: (body) => ({
                url: '/guards',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Guards'],
        }),
        updateGuard: builder.mutation<any, { id: string, body: { fullname?: string, employeeNumber?: string, phone?: string } }> ({
            query: ({ id, body }) => ({
                url: `/guards/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Guards'],
        }),
        toggleGuard: builder.mutation<any, string> ({
            query: (id) => ({
                url: `/guards/${id}/toggle`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Guards']
        }),
    }),
});

export const { 
    useGetContractsQuery,
    useCreateContractMutation,
    useToggleContractMutation,
    useGetGuardsQuery,
    useCreateGuardMutation,
    useUpdateGuardMutation,
    useToggleGuardMutation
} = api;