// Google Apps Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxOku_tvcEF88FQCCQoNcpI81WcJaZkqAGB-06qhOBFSkxw7FTZopjeaNwT8CSRTae/exec";
// ============================================
// MAIN FORM HANDLER - FIXED VERSION
// ============================================

document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('🔄 Form submission started...');
    
    // Reset validation
    resetValidation();
    
    // Get form data
    const formData = {
        name: document.getElementById('fullName').value.trim(),
        program: document.getElementById('program').value,
        nik: document.getElementById('nik').value.trim(),
        phone: document.getElementById('phone').value.trim().replace(/\s/g, ''),
        address: document.getElementById('address').value.trim(),
        timestamp: new Date().toISOString()
    };
    
    console.log('📝 Form data:', formData);
    
    // Validation
    if (!validateForm(formData)) {
        console.log('❌ Validation failed');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // METHOD 1: Coba dengan XMLHttpRequest (LEBIH BAIK untuk Google Apps Script)
    submitWithXHR(formData);
});

// ============================================
// SUBMIT FUNCTIONS - MULTIPLE METHODS
// ============================================

// Method 1: XMLHttpRequest (RECOMMENDED)
function submitWithXHR(data) {
    console.log('🔄 Trying XHR method...');
    
    const xhr = new XMLHttpRequest();
    const url = GOOGLE_SCRIPT_URL;
    
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            showLoading(false);
            
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('✅ XHR Success:', response);
                    
                    if (response.success) {
                        showSuccessModal(data);
                        document.getElementById('registrationForm').reset();
                        
                        // Open WhatsApp
                        setTimeout(() => {
                            sendWhatsAppNotification(data);
                        }, 1500);
                        
                    } else {
                        showErrorModal(response.message || 'Gagal menyimpan data');
                    }
                } catch (error) {
                    console.log('⚠️ XHR Response not JSON, but might still succeed');
                    showSuccessModal(data);
                    document.getElementById('registrationForm').reset();
                    
                    setTimeout(() => {
                        sendWhatsAppNotification(data);
                    }, 1500);
                }
            } else {
                console.log('❌ XHR Failed:', xhr.status, xhr.statusText);
                
                // Fallback to Method 2
                submitWithFormData(data);
            }
        }
    };
    
    xhr.onerror = function() {
        console.log('❌ XHR Network error');
        showLoading(false);
        submitWithFormData(data);
    };
    
    xhr.timeout = 10000; // 10 seconds timeout
    xhr.ontimeout = function() {
        console.log('❌ XHR Timeout');
        showLoading(false);
        submitWithFormData(data);
    };
    
    try {
        xhr.send(JSON.stringify(data));
    } catch (error) {
        console.log('❌ XHR Send error:', error);
        showLoading(false);
        submitWithFormData(data);
    }
}

// Method 2: FormData (Alternative)
function submitWithFormData(data) {
    console.log('🔄 Trying FormData method...');
    
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('program', data.program);
    formData.append('nik', data.nik);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('timestamp', data.timestamp);
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData,
        // mode: 'no-cors' // JANGAN pakai no-cors!
    })
    .then(response => {
        console.log('📨 FormData response status:', response.status);
        showLoading(false);
        
        // Even if we can't read response, assume success
        showSuccessModal(data);
        document.getElementById('registrationForm').reset();
        
        setTimeout(() => {
            sendWhatsAppNotification(data);
        }, 1500);
        
        // Try to sync with localStorage backup
        saveToLocalStorage(data);
    })
    .catch(error => {
        console.log('❌ FormData error:', error);
        showLoading(false);
        
        // Final fallback: localStorage
        if (saveToLocalStorage(data)) {
            showWarningModal(data);
            document.getElementById('registrationForm').reset();
        } else {
            showErrorModal('Gagal mengirim data. Coba lagi nanti.');
        }
    });
}

// ============================================
// BACKUP SYSTEM - localStorage
// ============================================

function saveToLocalStorage(data) {
    try {
        const pending = JSON.parse(localStorage.getItem('tiktaktop_pending') || '[]');
        pending.push({
            ...data,
            savedAt: new Date().toISOString(),
            id: Date.now() + Math.random()
        });
        
        localStorage.setItem('tiktaktop_pending', JSON.stringify(pending));
        console.log('💾 Saved to localStorage, total pending:', pending.length);
        return true;
    } catch (error) {
        console.error('❌ localStorage error:', error);
        return false;
    }
}

function syncPendingData() {
    try {
        const pending = JSON.parse(localStorage.getItem('tiktaktop_pending') || '[]');
        if (pending.length === 0) return;
        
        console.log('🔄 Syncing', pending.length, 'pending data...');
        
        // Sync satu per satu
        pending.forEach((data, index) => {
            setTimeout(() => {
                submitWithXHR(data);
            }, index * 1000); // Delay 1 detik antar data
        });
        
    } catch (error) {
        console.error('❌ Sync error:', error);
    }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateForm(data) {
    let isValid = true;
    
    // Nama lengkap
    if (!data.name || data.name.length < 3) {
        showValidationError('fullName', 'Nama lengkap minimal 3 karakter');
        isValid = false;
    }
    
    // Program
    if (!data.program) {
        showValidationError('program', 'Pilih program kursus');
        isValid = false;
    }
    
    // NIK
    if (!data.nik || data.nik.length !== 16) {
        showValidationError('nik', 'NIK harus 16 digit');
        isValid = false;
    }
    
    // Phone
    const phoneRegex = /^08[0-9]{8,13}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
        showValidationError('phone', 'Format WhatsApp: 08xxxxxxxxxx (10-15 digit)');
        isValid = false;
    }
    
    // Address
    if (!data.address || data.address.length < 10) {
        showValidationError('address', 'Alamat minimal 10 karakter');
        isValid = false;
    }
    
    // Terms
    if (!document.getElementById('terms').checked) {
        showValidationError('terms', 'Anda harus menyetujui syarat dan ketentuan');
        isValid = false;
    }
    
    return isValid;
}

function showValidationError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-invalid');
        
        let feedback = field.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.appendChild(feedback);
        }
        
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
}

function resetValidation() {
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    
    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.style.display = 'none';
    });
}

// ============================================
// UI FUNCTIONS
// ============================================

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showSuccessModal(data) {
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    const title = document.querySelector('#successModal h4');
    
    if (title) {
        title.textContent = `Selamat ${data.name}! Pendaftaran ${data.program} berhasil.`;
    }
    
    modal.show();
}

function showWarningModal(data) {
    // Buat modal warning
    const warningHtml = `
        <div class="modal fade" id="warningModal">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-warning text-center w-100">
                            <i class="fas fa-exclamation-triangle me-2"></i>Data Disimpan Sementara
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-4">
                            <i class="fas fa-database fa-3x text-warning"></i>
                        </div>
                        <h5 class="mb-3 text-cyan">Data Anda Aman!</h5>
                        <p class="mb-4">Koneksi internet terdeteksi lambat. Data telah disimpan secara lokal dan akan dikirim otomatis saat koneksi membaik.</p>
                        
                        <div class="alert alert-info">
                            <strong>Detail yang disimpan:</strong><br>
                            Nama: ${data.name}<br>
                            Program: ${data.program}<br>
                            WhatsApp: ${data.phone}
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-primary w-100" data-bs-dismiss="modal">
                            <i class="fas fa-check me-2"></i>Mengerti
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', warningHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('warningModal'));
    modal.show();
    
    // Hapus modal setelah ditutup
    document.getElementById('warningModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function showErrorModal(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
}

// ============================================
// WHATSAPP FUNCTION
// ============================================

function sendWhatsAppNotification(data) {
    try {
        const phone = data.phone.startsWith('0') ? '62' + data.phone.slice(1) : data.phone;
        const message = `Halo ${data.name}!

Terima kasih telah mendaftar di *TikTakTop Course*.

📋 **Detail Pendaftaran:**
👤 Nama: ${data.name}
📚 Program: ${data.program}
📱 WhatsApp: ${data.phone}

Tim kami akan menghubungi Anda dalam 1x24 jam untuk konfirmasi.

Salam hangat,
TikTakTop Course Team`;

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
    } catch (error) {
        console.error('❌ WhatsApp error:', error);
    }
}

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('load', function() {
    console.log('🚀 TikTakTop Form initialized');
    
    // Test API connection
    testAPI();
    
    // Sync pending data
    syncPendingData();
    
    // Update copyright year
    updateCopyrightYear();
    
    // Setup animations
    setupAnimations();
});

function testAPI() {
    console.log('🔍 Testing API connection...');
    
    fetch(GOOGLE_SCRIPT_URL + '?test=connection')
        .then(response => response.json())
        .then(data => {
            console.log('✅ API Status:', data.status);
            if (data.status && data.status.includes('✅')) {
                console.log('🎉 API connected successfully!');
            }
        })
        .catch(error => {
            console.warn('⚠️ API test failed:', error);
        });
}

function updateCopyrightYear() {
    const year = new Date().getFullYear();
    const copyright = document.querySelector('.copyright p');
    if (copyright) {
        copyright.innerHTML = copyright.innerHTML.replace('2023', year);
    }
}

function setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 0.6s ease-out';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .class-card, .service-card, .mission-card, .fact-item').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// SMOOTH SCROLLING
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
            
            // Close mobile navbar if open
            const navbarCollapse = document.querySelector('.navbar-collapse.show');
            if (navbarCollapse) {
                navbarCollapse.classList.remove('show');
            }
        }
    });
});