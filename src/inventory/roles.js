/**
 * NOVA-0100 — Roles & Permissions
 * Role definitions and permission map per kane's ADR §4.
 * UI must label role switcher as client-side only — NOT authentication.
 *
 * Roles: owner | admin | manager | staff | customer
 * Permission map: can(role, action) returns boolean.
 */

/** @type {'owner'|'admin'|'manager'|'staff'|'customer'} */
const Role = 'owner'

/** Permission matrix: can(role, action)
 * True = role has permission, False = role denied.
 * Per kane's ADR §4 — UI hides disabled actions and labels role as simulator.
 */
function can(role, action) {
  const perms = {
    owner: {
      viewCatalogue: true, createEditProduct: true, deleteProduct: true,
      adjustStock: true, receivePO: true, createConfirmPO: true,
      viewAudit: true, manageUsers: true,
    },
    admin: {
      viewCatalogue: true, createEditProduct: true, deleteProduct: true,
      adjustStock: true, receivePO: true, createConfirmPO: true,
      viewAudit: true, manageUsers: false,
    },
    manager: {
      viewCatalogue: true, createEditProduct: true, deleteProduct: false,
      adjustStock: true, receivePO: true, createConfirmPO: true,
      viewAudit: true, manageUsers: false,
    },
    staff: {
      viewCatalogue: true, createEditProduct: false, deleteProduct: false,
      adjustStock: false, receivePO: true, createConfirmPO: false,
      viewAudit: false, manageUsers: false,
    },
    customer: {
      viewCatalogue: true, createEditProduct: false, deleteProduct: false,
      adjustStock: false, receivePO: false, createConfirmPO: false,
      viewAudit: false, manageUsers: false,
    },
  }
  return !!perms[role]?.[action]
}

/** Human-readable role name for UI display
 * @param {string} role
 * @returns {string} */
function roleName(role) {
  const names = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    staff: 'Staff',
    customer: 'Customer',
  }
  return names[role] || role
}

/** Honest label text for the role simulator in the UI */
function roleSimulatorLabel() {
  return '<span class="text-xs font-medium text-orange-500">role simulation: client-side only, not authentication</span>'
}

module.exports = { Role, can, roleName, roleSimulatorLabel }