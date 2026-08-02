// Local-only admin page (Firebase removed)
import { requireRole, logoutUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const session = requireRole(['admin']);
  if (!session) return;

  // Minimal UI wiring: logout
  window.handleLogout = () => logoutUser();

  // Show placeholder stats
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setText('totalTurnover', '₹0');
  setText('totalFarmers', '0');
  setText('totalManufacturers', '0');
  setText('totalStubbleSold', '0');
  setText('topBuyer', '-');
  setText('topSeller', '-');
});
