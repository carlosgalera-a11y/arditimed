document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const listItems = document.querySelectorAll('.list-item');
    const navBtns = document.querySelectorAll('.nav-btn');

    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Add a little bounce to list items when switching tabs for a dynamic feel
            listItems.forEach((item, index) => {
                item.style.transform = 'translateY(10px)';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease';
                    item.style.transform = 'translateY(0)';
                    item.style.opacity = '1';
                }, 50 * index);
            });
        });
    });

    // Bottom Navigation activation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Card click animation
    listItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.list-title').innerText;
            console.log(`Navigating to ${title}...`);
            // Here you could trigger navigation or open a new view
        });
    });
});
