'use client';

import { type ChangeEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  hasPermission,
  type Contract,
  type ContractFormValues,
} from '@segapp/contracts';

import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import {
  useGetContractsQuery,
  useGetContractListQuery,
  useGetCurrentSessionQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useUpdateContractStatusMutation,
} from '@/store/api';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

import ContractCard from './components/ContractCard';
import ContractDetailsModal from './components/ContractDetailsModal';
import ContractFormModal from './components/ContractFormModal';

import {
  formatContractDate,
  getEmptyContractFormValues,
  contractToFormValues,
  matchesContractSearch,
} from './contract.utils';

import styles from './contracts.module.css';

const EMPTY_CONTRACT_FORM_VALUES = getEmptyContractFormValues();

export default function ContractsPage() {
  const { data: session } = useGetCurrentSessionQuery();

  if (!session) return <p className="pMuted">Verificando sesión...</p>;

  const roles = session.membership.roles;
  if (!hasPermission(roles, 'contracts:list')) {
    return <p className="pMuted">No tienes acceso a contratos.</p>;
  }

  return hasPermission(roles, 'contracts:manage') ? (
    <ContractsManagementPage
      canChangeStatus={hasPermission(roles, 'contracts:status')}
    />
  ) : (
    <ContractsReadOnlyPage />
  );
}

function ContractsReadOnlyPage() {
  const {
    data: contracts = [],
    isLoading,
    isError,
  } = useGetContractListQuery();

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Contratos</h1>
          <p className="pMuted">Listado de contratos de la empresa.</p>
        </div>
        <Badge tone="info">{contracts.length} contratos</Badge>
      </div>
      <section className="panel">
        <div className="grid gridCards">
          {isLoading && <p className="pMuted">Cargando contratos...</p>}
          {isError && (
            <p className={styles.textDanger}>
              No fue posible cargar contratos.
            </p>
          )}
          {!isLoading && !isError && contracts.length === 0 && (
            <p className="pMuted">No hay contratos registrados.</p>
          )}
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <h2>{contract.name}</h2>
              <p className="pMuted">Cliente: {contract.clientLegalName}</p>
              <p>Estado: {contract.active ? 'Activo' : 'Inactivo'}</p>
              <p>Inicio: {formatContractDate(contract.startDate)}</p>
              <p>Guardias requeridos: {contract.requiredGuardCount}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function ContractsManagementPage({
  canChangeStatus,
}: {
  canChangeStatus: boolean;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);
  const [contractToView, setContractToView] = useState<Contract | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const {
    data: contracts,
    isLoading: isLoadingContracts,
    error: contractsError,
  } = useGetContractsQuery();
  const [createContract, { isLoading: isCreating }] =
    useCreateContractMutation();
  const [updateContract, { isLoading: isUpdating }] =
    useUpdateContractMutation();
  const [updateContractStatus, { isLoading: isUpdatingStatus }] =
    useUpdateContractStatusMutation();

  const editInitialValues = useMemo(
    () =>
      contractToEdit
        ? contractToFormValues(contractToEdit)
        : EMPTY_CONTRACT_FORM_VALUES,
    [contractToEdit],
  );

  const filteredContracts = useMemo(
    () =>
      (contracts ?? []).filter((contract) =>
        matchesContractSearch(contract, searchValue),
      ),
    [contracts, searchValue],
  );

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value);
  }

  function handleOpenCreate() {
    setIsCreateOpen(true);
  }

  function handleCloseCreate() {
    if (isCreating) return;

    setIsCreateOpen(false);
  }

  function handleOpenEdit(contract: Contract) {
    setContractToEdit(contract);
  }

  function handleCloseEdit() {
    if (isUpdating) return;

    setContractToEdit(null);
  }

  function handleOpenDetails(contract: Contract) {
    setContractToView(contract);
  }

  function handleCloseDetails() {
    setContractToView(null);
  }

  async function handleCreateContract(
    values: ContractFormValues,
  ): Promise<boolean> {
    const toastId = toast.loading('Creando contrato...');

    try {
      await createContract(values).unwrap();

      toast.success('Contrato creado', { id: toastId });
      setIsCreateOpen(false);

      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al crear contrato'), {
        id: toastId,
      });

      return false;
    }
  }

  async function handleUpdateContract(
    values: ContractFormValues,
  ): Promise<boolean> {
    if (!contractToEdit) return false;

    const toastId = toast.loading('Guardando cambios...');

    try {
      await updateContract({
        id: contractToEdit.id,
        body: values,
      }).unwrap();

      toast.success('Contrato actualizado', {
        id: toastId,
      });

      setContractToEdit(null);

      return true;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar el contrato.'), {
        id: toastId,
      });

      return false;
    }
  }

  async function handleToggleActive(contract: Contract) {
    if (isUpdatingStatus) return;

    const toastId = toast.loading('Actualizando estatus...');

    const body = {
      id: contract.id,
      body: {
        active: !contract.active,
      },
    };

    try {
      await updateContractStatus(body).unwrap();
      toast.success('Estatus actualizado', { id: toastId });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar el contrato'), {
        id: toastId,
      });
    }
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Contratos</h1>
          <p className="pMuted">
            Gestión de contratos y estatus operativo de tu empresa.
          </p>
        </div>
        <Badge tone="info">{filteredContracts.length} contratos</Badge>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className={styles.toolbarGrid}>
            <div className={styles.searchRow}>
              <div>
                <div className={styles.fieldLabel}>Buscar</div>
                <Input
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Buscar contratos..."
                />
              </div>
            </div>

            <Button type="button" onClick={handleOpenCreate}>
              Agregar Contrato
            </Button>
          </div>
        </div>

        <div className="grid gridCards">
          {isLoadingContracts && (
            <div className={styles.textMuted}> Cargando Contratos... </div>
          )}

          {contractsError && (
            <div className={styles.textDanger}>Error al cargar contratos.</div>
          )}

          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              isUpdatingStatus={isUpdatingStatus}
              canChangeStatus={canChangeStatus}
              onView={handleOpenDetails}
              onEdit={handleOpenEdit}
              onToggleActive={handleToggleActive}
            />
          ))}

          {!isLoadingContracts &&
            !contractsError &&
            filteredContracts.length === 0 && (
              <div className={styles.textMuted}>No hay resultados.</div>
            )}
        </div>
      </section>
      <ContractFormModal
        open={isCreateOpen}
        title="Agregar contrato"
        initialValues={EMPTY_CONTRACT_FORM_VALUES}
        isSubmitting={isCreating}
        submitLabel="Agregar"
        disabledWhenPristine={false}
        onSubmit={handleCreateContract}
        onClose={handleCloseCreate}
      />

      <ContractFormModal
        open={contractToEdit !== null}
        title="Editar contrato"
        initialValues={editInitialValues}
        isSubmitting={isUpdating}
        submitLabel="Actualizar"
        disabledWhenPristine
        onSubmit={handleUpdateContract}
        onClose={handleCloseEdit}
      />

      <ContractDetailsModal
        contract={contractToView}
        open={contractToView !== null}
        onClose={handleCloseDetails}
      />
    </>
  );
}
