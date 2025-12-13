// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Form submission
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('fullName').value,
        program: document.getElementById('program').value,
        nik: document.getElementById('nik').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        timestamp: new Date().toLocaleString()
    };
    
    // Show success modal
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();
    
    // Log data (in production, send to Google Sheets)
    console.log('Form data submitted:', formData);
    
    // Reset form
    this.reset();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth scrolling
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

// Animate cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease-out';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.feature-card, .class-card, .service-card, .mission-card, .fact-item').forEach(el => {
    observer.observe(el);
});

// Update copyright year
document.addEventListener('DOMContentLoaded', function() {
    const year = new Date().getFullYear();
    document.querySelector('.copyright p').innerHTML = 
        document.querySelector('.copyright p').innerHTML.replace('2023', year);
});

// Add hover effect to all cards
document.querySelectorAll('.feature-card, .class-card, .service-card, .mission-card, .fact-item').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease';
    });
});