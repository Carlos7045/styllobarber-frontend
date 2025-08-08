/**
 * Barrel exports para services de usuários
 */

export { ClientService, clientService } from './ClientService'

// Re-export types
export type {
  Client,
  CreateClientData,
  UpdateClientData,
  ClientFilters,
} from './ClientService'