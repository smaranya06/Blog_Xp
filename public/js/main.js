/**
 * @fileoverview Main Client-Side Utility Script
 * @description Provides interactive client utilities such as delete confirmation
 * prompts and automated notification dismissals.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Confirm before deleting any blog post
  const deleteForms = document.querySelectorAll('form.delete-post-form');
  deleteForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const confirmed = window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.');
      if (!confirmed) {
        event.preventDefault();
      }
    });
  });

  // 2. Auto-fade out success alerts after 4 seconds with smooth collapse
  const successAlerts = document.querySelectorAll('.alert-success');
  successAlerts.forEach((alert) => {
    setTimeout(() => {
      if (alert && alert.parentNode) {
        alert.classList.add('is-hiding');
        setTimeout(() => {
          if (alert && alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 350);
      }
    }, 4000);
  });

  // 3. Clean flash notification query parameters from browser address bar
  // Ensures refreshing the page (F5) will never display the welcome/success banner again
  if (window.history && window.history.replaceState) {
    const url = new URL(window.location.href);
    const flashParams = ['login', 'welcome', 'deleted', 'logout'];
    let changed = false;
    flashParams.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    });
    if (changed) {
      const cleanUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
});
