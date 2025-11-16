import { auth, db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, where } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Check if user is admin
auth.onAuthStateChanged((user) => {
    if (!user || user.email !== 'admin@gmail.com') {
        window.location.href = '../index.html';
    }
});

// Delete contact submission
async function deleteSubmission(submissionId) {
    try {
        if (confirm('Are you sure you want to delete this message?')) {
            await deleteDoc(doc(db, 'contactSubmissions', submissionId));
            showToast('Message deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting submission:', error);
        showToast('Error deleting message', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Load contact submissions
function loadContactSubmissions() {
    const q = query(collection(db, 'contactSubmissions'), orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const table = document.getElementById('contactSubmissionsTable');
        table.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.name}</td>
                <td>${data.email}</td>
                <td>
                    <div class="message-cell">
                        ${data.message}
                    </div>
                </td>
                <td>${new Date(data.timestamp).toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${doc.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add delete button event listener
            const deleteBtn = row.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteSubmission(doc.id));
            
            table.appendChild(row);
        });
    });
}

// Handle logout
window.handleLogout = async function() {
    try {
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showToast('Error signing out', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContactSubmissions();
});

// Load and display contact messages
function loadContactMessages() {
    const q = query(collection(db, 'contact_messages'), orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const tableBody = document.getElementById('contactMessagesTable');
        tableBody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${new Date(data.timestamp).toLocaleString()}</td>
                <td>${data.name}</td>
                <td>${data.email}</td>
                <td>${data.message}</td>
                <td><span class="message-status status-${data.status}">${data.status}</span></td>
                <td class="actions-column">
                    ${data.status === 'unread' ? 
                        `<button class="action-btn mark-read-btn" onclick="markAsRead('${doc.id}')">
                            <i class="fas fa-check"></i>
                        </button>` : ''
                    }
                    <button class="action-btn delete-btn" onclick="deleteMessage('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    });
}

// Mark message as read
window.markAsRead = async (messageId) => {
    try {
        await updateDoc(doc(db, 'contact_messages', messageId), {
            status: 'read'
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
};

// Delete message
window.deleteMessage = async (messageId) => {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            await deleteDoc(doc(db, 'contact_messages', messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
}; 

async function updateOrderStatus(orderId, newStatus, manufacturerId, farmerId) {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: new Date().toISOString() });
    await Promise.all([
        addDoc(collection(db, 'notifications'), {
            userId: manufacturerId,
            message: `Order ${orderId} status updated to ${newStatus}`,
            type: 'order',
            createdAt: new Date().toISOString(),
            read: false
        }),
        addDoc(collection(db, 'notifications'), {
            userId: farmerId,
            message: `Order ${orderId} status updated to ${newStatus}`,
            type: 'order',
            createdAt: new Date().toISOString(),
            read: false
        })
    ]);
}

function listenToOrders(userId) {
    const q = query(collection(db, 'orders'), where('manufacturerId', '==', userId));
    onSnapshot(q, (snapshot) => {
        // Update your orders table in real time
    });
} 