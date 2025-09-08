import { api } from './api.js';

// Simple alert function for the login page
function showAlert(message, type = 'danger') {
    const alertPlaceholder = document.getElementById('alert-placeholder');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');
    alertPlaceholder.append(wrapper);
}

async function handleLogin(e) {
    e.preventDefault();
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;

    try {
        await api.login(username, password);
        window.location.href = 'index.html'; // Redirect to the main app
    } catch (error) {
        showAlert('Error: ' + error.message, 'danger');
    }
}

// Check for an existing session when the page loads
async function checkSessionAndRedirect() {
    try {
        await api.checkSession();
        // If session exists, redirect to the main application
        window.location.href = 'index.html';
    } catch (error) {
        // No session, stay on the login page
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSessionAndRedirect();
    document.getElementById('login-form').addEventListener('submit', handleLogin);
});